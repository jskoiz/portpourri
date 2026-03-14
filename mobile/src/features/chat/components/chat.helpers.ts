export function getActivityTag(user: any): string {
  const goal = user?.fitnessProfile?.primaryGoal;
  if (!goal) return '';

  const map: Record<string, string> = {
    strength: 'Strength',
    weight_loss: 'Conditioning',
    endurance: 'Endurance',
    mobility: 'Mobility',
    connection: 'Connection',
    performance: 'Performance',
    both: 'Open',
  };

  return map[goal] || '';
}

