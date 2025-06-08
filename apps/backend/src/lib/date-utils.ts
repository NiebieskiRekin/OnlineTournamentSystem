export function addHours(d: Date | string, h: number) {
    if (typeof d === "string") {
        return new Date(Date.parse(d) +  h*60*60*1000).toDateString();
    } else if (d instanceof Date) {
        d.setTime(d.getTime() + (h*60*60*1000));
        return d.toDateString();
    }
    throw new Error("Invalid date");
}