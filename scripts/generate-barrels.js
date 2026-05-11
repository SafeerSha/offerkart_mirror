#!/usr/bin/env node

/**
 * Import Optimization Helper Script
 * Generates barrel exports for better import management
 */

const fs = require('fs');
const path = require('path');

// Configuration for different barrel exports
const configs = {
  shared: {
    path: 'src/components/shared/index.ts',
    imports: [
      "export { Heading, Subheading, Text, SectionTitle } from './Typography';",
      "export { PremiumCard } from './PremiumCard';",
      "export { PremiumButton } from './PremiumButton';",
      "export { PremiumInput } from './PremiumInput';",
      "export { PremiumDatePicker } from './PremiumDatePicker';",
      "export { AppModal } from './AppModal';",
      "export { ImagePreviewModal } from './ImagePreviewModal';",
      "export { StatusToggleButton } from './StatusToggleButton';",
      "export { MultiSearchableSelect } from './MultiSearchableSelect';",
      "export { SearchableSelect } from './SearchableSelect';"
    ]
  },

  hooks: {
    path: 'src/hooks/index.ts',
    imports: [
      "export {",
      "  useMyShops, useBranches, useAllOffers, useAllProducts,",
      "  useDeleteOffer, useToggleOfferStatus, useCreateProduct,",
      "  useUpdateProduct, useDeleteProduct, useToggleOfferProductStatus,",
      "  useCategories, useSubcategories",
      "} from './useApi';",
      "export { useIsMobile } from './use-mobile';",
      "export { useCategoryHierarchy } from './useCategoryHierarchy';"
    ]
  },

  api: {
    path: 'src/lib/api/index.ts',
    imports: [
      "export { getBranches } from './branch';",
      "export { getMyShops, registerShop, loginShop, addShop, updateShop } from './shop';",
      "export { s3Api } from './s3';",
      "export { createOffer, updateOffer } from './offers';",
      "export { getCategories, getSubCategories } from './categories';",
      "export { getOfferProductById, createOfferProduct, updateOfferProduct } from './offerproduct';"
    ]
  },

  icons: {
    path: 'src/lib/icons.ts',
    imports: [
      "export {",
      "  ArrowRight, ArrowLeft, ArrowUpRight, ChevronRight, ChevronDown, ChevronUp,",
      "  X, Plus, Minus, Search, Filter, Settings, Loader2,",
      "  Eye, EyeOff, Check, AlertTriangle, Info, Clock, Power,",
      "  LogOut, LayoutDashboard, MoreVertical, MousePointer2,",
      "  Store, ShoppingBag, GitBranch, MapPin, BarChart3,",
      "  Paintbrush, Palette, Layers, Grid3X3, Move, RotateCcw,",
      "  AlignLeft, AlignCenter, AlignRight, Share, Heart, Star,",
      "  MessageCircle, Type, FileText, ImageIcon, Package, Tag,",
      "  Ticket, Calendar, Edit, Pencil, Trash2, Send, Download, Upload, Save, Undo2, Redo2",
      "} from 'lucide-react';"
    ]
  }
};

/**
 * Generate barrel export file
 */
function generateBarrelExport(config) {
  const content = [
    `// Auto-generated barrel export - ${new Date().toISOString()}`,
    `// Run: npm run generate-barrels`,
    '',
    ...config.imports,
    ''
  ].join('\n');

  const dir = path.dirname(config.path);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  fs.writeFileSync(config.path, content);
  console.log(`✅ Generated ${config.path}`);
}

/**
 * Main execution
 */
function main() {
  console.log('🚀 Generating barrel exports...\n');

  Object.entries(configs).forEach(([name, config]) => {
    try {
      generateBarrelExport(config);
    } catch (error) {
      console.error(`❌ Failed to generate ${name}:`, error.message);
    }
  });

  console.log('\n✨ Barrel exports generated successfully!');
  console.log('\n📝 Next steps:');
  console.log('1. Update your imports to use the new barrel exports');
  console.log('2. Run your linter to check for unused imports');
  console.log('3. Test your application to ensure everything works');
}

if (require.main === module) {
  main();
}

module.exports = { generateBarrelExport, configs };