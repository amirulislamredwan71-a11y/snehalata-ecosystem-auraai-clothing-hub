import * as lucide from 'lucide-react';
const allImports = [
  "Shield", "FileText", "BarChart3", "ShoppingBag", "X", "Zap", "Phone", "MessageSquare",
  "Send", "Sparkles", "Bot", "User", "Loader2", "Cpu", "Download", "Trash2",
  "MoreHorizontal", "ArrowUp", "Search", "Menu", "PackageSearch", "History", "LayoutGrid",
  "UserPlus", "Globe", "LayoutDashboard", "ShoppingCart", "Eye", "Plus", "Minus",
  "CheckCircle2", "Shirt", "ShieldCheck", "Palette", "RefreshCcw", "Share2", "Wand2",
  "ArrowRight", "CreditCard", "Smartphone", "Lock", "Mail", "ChevronRight", "AlertCircle",
  "Upload", "Camera", "Package", "MapPin", "Truck", "Wallet", "Settings"
];

const undefinedIcons = allImports.filter(icon => typeof (lucide as any)[icon] === 'undefined');
if (undefinedIcons.length > 0) {
    console.log("Undefined Icons:", undefinedIcons.join(', '));
} else {
    console.log("All icons exist.");
}
