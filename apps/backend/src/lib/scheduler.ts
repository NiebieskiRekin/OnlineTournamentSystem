/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import cron from "node-cron";
import { tournament, participant, match, matchParticipant } from "../db/schema";
import { db } from "../db";
import {eq, and, lt, desc, gt} from "drizzle-orm"
import logger from "./logger";

export async function createGroups(tournamentId: number) {
  logger.info("Creating groups for tournament "+tournamentId)

  // Fetch participants with their scores, ordered by score descending (higher score = better seed)
  const sortedParticipants = await db.select({ id: participant.id, score: participant.score })
    .from(participant)
    .where(eq(participant.tournament, tournamentId))
    .orderBy(desc(participant.score));

  const P = sortedParticipants.length;
  if (P < 2) {
    logger.warn(`Tournament ${tournamentId} has less than 2 participants (${P}). Cannot create bracket.`);
    return false;
  }

  // Determine bracket size (next power of 2)
  const N_bracket = (P <= 2) ? 2 : (1 << Math.ceil(Math.log2(P)));
  logger.info(`Participant count P=${P}, Bracket size N_bracket=${N_bracket}`);

  const tempMatchObjects: {
    tempId: string;
    tournament: number;
    level: number;
    state: 'NO_PARTY';
    nextMatchTempId?: string;
    // assignedParticipantTempIds?: (string | null)[]; // If using temp participant IDs
  }[] = [];

  let tempIdCounter = 0;
  const generateTempId = () => `TEMP_MATCH_${tempIdCounter++}`;

  // --- Generate Upper Bracket (WB) Matches ---
  const wbMatchTempIdsByRound: string[][] = [];
  const wbRounds = N_bracket > 1 ? Math.log2(N_bracket) : 0;
  let firstRoundWbMatchTempIds: string[] = [];

  for (let r = 1; r <= wbRounds; r++) {
    const matchesInThisWbRound = N_bracket / (2 ** r);
    const currentRoundTempIds: string[] = [];
    for (let i = 0; i < matchesInThisWbRound; i++) {
      const tempId = generateTempId();
      tempMatchObjects.push({ tempId, tournament: tournamentId, level: r, state: 'NO_PARTY' });
      currentRoundTempIds.push(tempId);
    }
    wbMatchTempIdsByRound.push(currentRoundTempIds);
    if (r === 1) {
      firstRoundWbMatchTempIds = [...currentRoundTempIds];
    }
  }

  // Link WB matches
  for (let r = 0; r < wbRounds - 1; r++) {
    const currentRound = wbMatchTempIdsByRound[r];
    const nextRound = wbMatchTempIdsByRound[r + 1];
    currentRound.forEach((tempId, index) => {
      const matchObj = tempMatchObjects.find(m => m.tempId === tempId);
      if (matchObj) matchObj.nextMatchTempId = nextRound[Math.floor(index / 2)];
    });
  }

  // --- Participant Assignment for WB Round 1 (level 1 matches) ---
  // Create a pool of participant IDs, padded with nulls for byes up to N_bracket
  const participantIdPool: (number | null)[] = [
    ...sortedParticipants.map(p => p.id),
    ...Array(N_bracket - P).fill(null)
  ];

  // Standard seeding algorithm for pairings in the first round
  // For N_bracket slots, generates N_bracket/2 pairs of seed indices
  // e.g., for N_bracket=8, pairings are indices for (1v8, 4v5, 3v6, 2v7)
  const getSeedingPairIndices = (numSlots: number): [number, number][] => {
    if (numSlots < 2) return [];
    if (numSlots === 2) return [[0, 1]]; // Seeds 0 and 1

    const rounds = Math.log2(numSlots);
    // Initial pairing for the smallest sub-bracket (seeds 0 and 1)
    let currentPairingsIndices: [number, number][] = [[0, 1]];

    for (let r = 1; r < rounds; r++) {
        const nextRoundPairingsIndices: [number, number][] = [];
        const currentMaxSeedInSubBracket = (1 << (r + 1)) -1; // e.g. for r=1 (N=4), max seed is 3 (0,1,2,3)
        for (const pair of currentPairingsIndices) {
            nextRoundPairingsIndices.push([pair[0], currentMaxSeedInSubBracket - pair[0]]);
            nextRoundPairingsIndices.push([pair[1], currentMaxSeedInSubBracket - pair[1]]);
        }
        currentPairingsIndices = nextRoundPairingsIndices;
    }
    return currentPairingsIndices;
  };

  const firstRoundSeedPairIndices = getSeedingPairIndices(N_bracket);
  const firstRoundParticipantIdPairs: (number | null)[][] = firstRoundSeedPairIndices.map(pair => [
    participantIdPool[pair[0]],
    participantIdPool[pair[1]]
  ]);

  // --- Generate Lower Bracket (LB) Matches ---
  // This is a simplified LB generation. A standard DE bracket has specific feeder logic.
  const lbMatchTempIdsByRound: string[][] = [];
  if (wbRounds > 1) { // LB exists only if WB has more than one round
    const totalLbRounds = 2 * (wbRounds - 1);
    let numMatchesInPreviousLbRound = 0;

    for (let r = 1; r <= totalLbRounds; r++) {
      let matchesInThisLbRound = 0;
      if (r % 2 === 1) { // Odd rounds, potentially fed by WB losers
        matchesInThisLbRound = N_bracket / (2 ** (Math.floor(r / 2) + 2));
      } else { // Even rounds, fed by previous LB round winners
        matchesInThisLbRound = numMatchesInPreviousLbRound / 2;
      }
      matchesInThisLbRound = Math.max(0, Math.floor(matchesInThisLbRound));
      if (matchesInThisLbRound === 0 && r < totalLbRounds) { // Avoid creating empty intermediate rounds
          if (numMatchesInPreviousLbRound === 1) matchesInThisLbRound = 1; // If prev round had 1 winner, next round has 1 match
      }
      if (r === totalLbRounds && matchesInThisLbRound === 0 && numMatchesInPreviousLbRound ===1 ) matchesInThisLbRound = 1; // Ensure final LB match if possible


      if (matchesInThisLbRound > 0) {
        const currentRoundTempIds: string[] = [];
        for (let i = 0; i < matchesInThisLbRound; i++) {
          const tempId = generateTempId();
          // LB levels start from 101 (100 + round_number)
          tempMatchObjects.push({ tempId, tournament: tournamentId, level: 100 + r, state: 'NO_PARTY' });
          currentRoundTempIds.push(tempId);
        }
        lbMatchTempIdsByRound.push(currentRoundTempIds);
        numMatchesInPreviousLbRound = matchesInThisLbRound;
      } else {
        // If no matches this round, push an empty array to maintain round count for linking
        lbMatchTempIdsByRound.push([]);
        numMatchesInPreviousLbRound = 0;
      }
    }

    // Link LB matches (simplified: winners advance)
    for (let r = 0; r < lbMatchTempIdsByRound.length - 1; r++) {
      const currentRound = lbMatchTempIdsByRound[r];
      const nextRound = lbMatchTempIdsByRound[r + 1];
      if (!currentRound || !nextRound || nextRound.length === 0) continue;

      currentRound.forEach((tempId, index) => {
        const matchObj = tempMatchObjects.find(m => m.tempId === tempId);
        // Simple progression: pair winners for next round
        if (matchObj && nextRound.length > 0) {
             matchObj.nextMatchTempId = nextRound[Math.floor(index / 2)];
        }
      });
    }
  }

  // --- Generate Grand Final (GF) Match ---
  const gfTempId = generateTempId();
  if (N_bracket >= 2) {
    // GF level starts from 201
    tempMatchObjects.push({ tempId: gfTempId, tournament: tournamentId, level: 201, state: 'NO_PARTY' });

    // Link WB final winner to GF
    if (wbMatchTempIdsByRound.length > 0) {
      const lastWbRound = wbMatchTempIdsByRound[wbRounds - 1];
      if (lastWbRound && lastWbRound.length === 1) {
        const wbFinalMatchObj = tempMatchObjects.find(m => m.tempId === lastWbRound[0]);
        if (wbFinalMatchObj) wbFinalMatchObj.nextMatchTempId = gfTempId;
      }
    }

    // Link LB final winner to GF
    if (lbMatchTempIdsByRound.length > 0) {
      const lastLbRoundTempIds = lbMatchTempIdsByRound[lbMatchTempIdsByRound.length - 1];
      if (lastLbRoundTempIds && lastLbRoundTempIds.length === 1) {
        const lbFinalMatchObj = tempMatchObjects.find(m => m.tempId === lastLbRoundTempIds[0]);
        if (lbFinalMatchObj) lbFinalMatchObj.nextMatchTempId = gfTempId;
      }
    }
    // Optional: A second GF match for bracket reset could be added here, level 202
    // and gfTempId would link to it.
  }


  // --- Database Operations ---
  return db.transaction(async (tx) => {
    if (tempMatchObjects.length === 0) {
      logger.warn(`No match objects generated for tournament ${tournamentId}.`);
      return false;
    }

    const dbInserts = tempMatchObjects.map(m => ({
      tournament: m.tournament,
      level: m.level,
      state: m.state,
      // nextMatch will be updated in a second pass
    }));

    const insertedMatches = await tx.insert(match)
      .values(dbInserts)
      .returning({ id: match.id });

    if (insertedMatches.length !== tempMatchObjects.length) {
      logger.error(`Mismatch in inserted matches count for tournament ${tournamentId}. Expected ${tempMatchObjects.length}, got ${insertedMatches.length}. Rolling back.`);
      throw new Error("Mismatch in inserted matches count, rolling back transaction.");
    }

    const tempIdToDbId = new Map<string, number>();
    tempMatchObjects.forEach((m, i) => {
      tempIdToDbId.set(m.tempId, insertedMatches[i].id);
    });

    // Update nextMatch links
    for (const tempM of tempMatchObjects) {
      if (tempM.nextMatchTempId) {
        const currentDbId = tempIdToDbId.get(tempM.tempId);
        const nextMatchDbId = tempIdToDbId.get(tempM.nextMatchTempId);
        if (currentDbId && nextMatchDbId) {
          await tx.update(match)
            .set({ nextMatch: nextMatchDbId })
            .where(eq(match.id, currentDbId));
        } else {
          logger.warn(`Could not find DB ID for linking: ${tempM.tempId} -> ${tempM.nextMatchTempId}`);
        }
      }
    }

    // Insert matchParticipant records for the first round WB matches
    const matchParticipantInserts: { match: number; participant: number; state: 'NOT_PLAYED' }[] = [];
    if (firstRoundWbMatchTempIds.length === firstRoundParticipantIdPairs.length) {
      firstRoundWbMatchTempIds.forEach((tempMatchId, index) => {
        const dbMatchId = tempIdToDbId.get(tempMatchId);
        if (!dbMatchId) {
          logger.error(`DB ID not found for WB R1 temp match ID ${tempMatchId} during participant assignment. Rolling back.`);
          throw new Error(`DB ID not found for WB R1 temp match ID ${tempMatchId}`);
        }
        const [p1Id, p2Id] = firstRoundParticipantIdPairs[index];
        if (p1Id !== null) {
          matchParticipantInserts.push({ match: dbMatchId, participant: p1Id, state: 'NOT_PLAYED' });
        }
        if (p2Id !== null) {
          matchParticipantInserts.push({ match: dbMatchId, participant: p2Id, state: 'NOT_PLAYED' });
        }
      });

      if (matchParticipantInserts.length > 0) {
        await tx.insert(matchParticipant).values(matchParticipantInserts);
        logger.info(`Inserted ${matchParticipantInserts.length} participant assignments for WB Round 1 of tournament ${tournamentId}`);
      }
    }

    await tx.update(participant).set({score: 0}).where(eq(participant.tournament,tournamentId))

    await tx.update(tournament).set({
      groupsCreated: true
    }).where(eq(tournament.id, tournamentId));

    logger.info(`Successfully created ${insertedMatches.length} match shells for tournament ${tournamentId}`);
    return true;
  }).catch(error => {
    logger.error(`Error creating groups for tournament ${tournamentId}:`, error);
    return false;
  });
}

export async function getTournamentsForGrouping(): Promise<number[]> {
  const tournaments = await db.select({
    tournament: tournament.id
  }).from(tournament)
  .where(and(eq(tournament.groupsCreated,false),lt(tournament.applicationDeadline,new Date().toDateString()),gt(tournament.participants,1)))
  .orderBy(tournament.id);

  return tournaments.map(t => t.tournament);
}

// every 5th minute
cron.schedule("*/5 * * * *", () => { 
    (getTournamentsForGrouping()).then(async (tournaments) =>{
      logger.info("Starting cron task - generating groups")
      for (const tournament of tournaments){
        try{
          if (await createGroups(tournament)){
            logger.info("Groups created for tournament "+tournament);
          } else {
            logger.error("Not enough participants "+tournament);
          }
        } catch (error){
          logger.error(error)
        }
      }
      logger.info("Finished cron task - generating groups")
    }).catch(error => {
      logger.error(error);
    })
});