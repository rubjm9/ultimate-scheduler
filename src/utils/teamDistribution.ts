// serpentineDistribution spreads seeds across groups in a snake pattern to balance competition.
export const serpentineDistribution = (teams: string[], groupCount: number) => {
  const groups: string[][] = Array.from({ length: groupCount }, () => []);
  let direction = 1;
  let index = 0;

  teams.forEach((team) => {
    groups[index].push(team);
    if (groupCount === 1) return;
    if (index === groupCount - 1) {
      direction = -1;
    } else if (index === 0) {
      direction = 1;
    }
    index += direction;
  });

  return groups;
};
