import * as lucide from 'lucide-react';
const extras = [
  "ArrowUpRight", "Store", "Play", "Scissors", "ExternalLink", "PackageCheck", "Navigation2", "Calendar"
];
extras.forEach(icon => console.log(icon, typeof (lucide as any)[icon]));
