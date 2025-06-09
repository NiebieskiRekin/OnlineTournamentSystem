import cron from "node-cron";
import { tournament, participant, match, matchParticipant } from "../db/schema";
import { db } from "../db";
import {eq, and, lt, desc} from "drizzle-orm"
import logger from "./logger";

function repeatArray<Type>(array: Array<Type>, count: number): typeof array {
  let out: typeof array = [];
  while (--count) {
    out = out.concat(array);
  }
  return out
};

async function createGroups(tournamentId: number) {
  await db.transaction(async tx => {
    const participants = await tx.select({
      p: participant.id,
      s: participant.score
    }).from(participant)
    .where(eq(participant.tournament,tournamentId))
    .orderBy(desc(participant.score));
  
    const grouped: Array<typeof participants> = []
    if (participants.length <= 5 ){
      // Każdy z każdym
      for (let i = 0; i < participants.length; i++) {
        for (let j = i+1; j < participants.length; j++) {
          if (i!=j){
            grouped.push([participants[i],participants[j]])
          }
        }
      }
    } else {
      if (participants.length % 2  != 0){
        // Trójka najlepszych gra każdy z każdym
        grouped.push([participants[0],participants[1]],[participants[1],participants[2]],[participants[0],participants[2]])
          
        // Reszta eliminacje
        let i = 3
        while (i < participants.length-1){
          grouped.push([participants[i],participants[i+1]])
          i += 1
        }
      } else {
        let i = 0
        // Każdy eliminacje
        while (i < participants.length-1){
          grouped.push([participants[i],participants[i+1]])
          i+=2
        }
      }
    }
    
    const baseMatch = {
      tournament: tournamentId,
      level: 0
    };
    const baseMatches = repeatArray<typeof baseMatch>([baseMatch],grouped.length)
    const matches = await tx.insert(match).values(baseMatches).returning({id: match.id});

    const matchParticipants = matches.map((m,i) => {
      return grouped[i].map(p => {
        return {
          match: m.id,
          participant: p.p
        }
      })
    }).flat()
    await tx.insert(matchParticipant).values(matchParticipants)
    await tx.update(tournament).set({
      groupsCreated: true
    }).where(eq(tournament.id,tournamentId))
  })
}

async function getTournamentsForGrouping(): Promise<number[]> {
  const tournaments = await db.select({
    tournament: tournament.id
  }).from(tournament)
  .where(and(eq(tournament.groupsCreated,false),lt(tournament.applicationDeadline,new Date().toDateString())))
  .orderBy(tournament.id);

  return tournaments.map(t => t.tournament);
}

// every 5th minute
cron.schedule("*/5 * * * *", () => { 
    (getTournamentsForGrouping()).then((tournaments) =>{
      logger.info("Starting cron task - generating groups")
      for (const tournament of tournaments){
        createGroups(tournament).then(()=>{
          logger.info("Groups created for tournament "+tournament);
        }).catch(error => {
          logger.error(error);
        })
      }
    }).catch(error => {
      logger.error(error);
    })
});