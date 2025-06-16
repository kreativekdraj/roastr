
const avatarColors = [
  'bg-red-500', 'bg-blue-500', 'bg-green-500', 'bg-yellow-500', 
  'bg-purple-500', 'bg-pink-500', 'bg-indigo-500', 'bg-teal-500'
];

export const getRandomAvatarColor = (username: string): string => {
  if (!username) return 'bg-orange-600';
  
  const hash = username.split('').reduce((acc, char) => {
    return char.charCodeAt(0) + ((acc << 5) - acc);
  }, 0);
  
  return avatarColors[Math.abs(hash) % avatarColors.length];
};

export const getAvatarInitials = (username: string): string => {
  if (!username) return '?';
  return username.split(' ').map(word => word[0]).join('').toUpperCase().slice(0, 2);
};
