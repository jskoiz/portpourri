import type React from 'react';
import AppIcon from '../../../components/ui/AppIcon';

export const CATEGORIES = ['All', 'Events', 'Trails', 'Gyms', 'Spots', 'Community'] as const;
export type ExploreCategory = (typeof CATEGORIES)[number];
type AppIconName = React.ComponentProps<typeof AppIcon>['name'];
type SpotTag = 'Trails' | 'Gyms';

export const ACTIVITY_SPOTS: Array<{
  color: string;
  distance: string;
  icon: AppIconName;
  id: string;
  name: string;
  tags: SpotTag[];
  type: string;
}> = [
  { id: '1', name: 'Magic Island', type: 'Run + Swim', icon: 'navigation', distance: '0.9 mi', color: '#34D399', tags: ['Trails'] },
  { id: '2', name: 'Kapiolani Park', type: 'Beach Games', icon: 'circle', distance: '1.4 mi', color: '#F59E0B', tags: ['Trails'] },
  { id: '3', name: 'Koko Head District Park', type: 'Stairs', icon: 'map', distance: '6.1 mi', color: '#F87171', tags: ['Trails'] },
  { id: '4', name: 'Ala Moana Beach Park', type: 'Open Water', icon: 'droplet', distance: '1.1 mi', color: '#7C6AF7', tags: ['Trails'] },
  { id: '5', name: 'Kailua Beach', type: 'Paddle', icon: 'anchor', distance: '10.5 mi', color: '#7AA8B8', tags: ['Trails'] },
  { id: '6', name: 'Makapuu Trail', type: 'Sunrise Hike', icon: 'sunrise', distance: '9.8 mi', color: '#34D399', tags: ['Trails'] },
  { id: '7', name: 'Honolulu Strength Lab', type: 'Strength Training', icon: 'activity', distance: '2.2 mi', color: '#60A5FA', tags: ['Gyms'] },
  { id: '8', name: 'Kaimuki Boxing Club', type: 'Boxing + Conditioning', icon: 'target', distance: '3.9 mi', color: '#F97316', tags: ['Gyms'] },
  { id: '9', name: 'Kakaako Yoga Loft', type: 'Mobility + Flow', icon: 'sun', distance: '1.8 mi', color: '#A78BFA', tags: ['Gyms'] },
];

export const COMMUNITY_POSTS = [
  { id: '1', user: 'Leilani, 28', activity: 'Rooftop Flow', text: 'Have room for 2 more at a mellow Kakaako sunset yoga session tomorrow.', spots: 2, initial: 'L', color: '#7C6AF7' },
  { id: '2', user: 'Kai, 31', activity: 'Sunrise Run', text: '4-mile social pace at Ala Moana, coffee after if anyone wants to keep hanging.', spots: 4, initial: 'K', color: '#34D399' },
  { id: '3', user: 'Malia, 32', activity: 'Ocean Swim', text: 'Queen’s Beach buoy loop on Saturday. Comfortable swimmers welcome.', spots: 3, initial: 'M', color: '#7AA8B8' },
  { id: '4', user: 'Devon, 35', activity: 'Climb Night', text: 'Putting together a beginner-friendly climbing crew next week if you want in.', spots: 5, initial: 'D', color: '#F59E0B' },
  { id: '5', user: 'Tessa, 29', activity: 'Beach Games', text: 'Anyone down for casual doubles at Kapiolani around golden hour?', spots: 6, initial: 'T', color: '#F87171' },
];

export const TRAIL_EVENT_KEYWORDS = ['run', 'running', 'trail', 'hike', 'hiking', 'cycle', 'cycling', 'swim', 'swimming', 'surf', 'surfing', 'paddle', 'paddling', 'beach', 'ocean', 'park', 'endurance'];
export const GYM_EVENT_KEYWORDS = ['boxing', 'strength', 'pilates', 'climb', 'climbing', 'dance', 'yoga', 'gym', 'studio', 'club', 'fitness', 'lab'];

