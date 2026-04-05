import type { Locale } from '@/lib/constants/site';
import { getDirectusAssetUrl } from '@/lib/directus/assets';
import { directusItemsRequest } from '@/lib/directus/client';
import { getLocalizedField } from '@/lib/i18n/translated';
import type { DirectusDownloadItem } from '@/types/directus';

export type DownloadItem = {
  id: string;
  title: string;
  description: string;
  category: string;
  fileType: string;
  fileUrl: string | null;
};

const DOWNLOAD_FIELDS = [
  'id',
  'title_zh',
  'title_en',
  'description_zh',
  'description_en',
  'file.id',
  'file.filename_download',
  'file_type',
  'download_category',
  'status',
].join(',');

const fallbackDownloads: DownloadItem[] = [
  {
    id: 'catalog-001',
    title: 'Product Catalog',
    description: 'Download the latest company product catalog.',
    category: 'catalog',
    fileType: 'PDF',
    fileUrl: null,
  },
  {
    id: 'datasheet-001',
    title: 'Technical Datasheet',
    description: 'Key specifications and technical reference document.',
    category: 'datasheet',
    fileType: 'PDF',
    fileUrl: null,
  },
];

function resolveFileUrl(file: DirectusDownloadItem['file']) {
  if (!file) return null;
  if (typeof file === 'string') return getDirectusAssetUrl(file);
  return getDirectusAssetUrl(file.id);
}

function mapDownload(item: DirectusDownloadItem, locale: Locale): DownloadItem {
  return {
    id: String(item.id),
    title: getLocalizedField(item, locale, 'title'),
    description: getLocalizedField(item, locale, 'description'),
    category: item.download_category || 'general',
    fileType: item.file_type || 'FILE',
    fileUrl: resolveFileUrl(item.file),
  };
}

export async function getDownloads(locale: Locale): Promise<DownloadItem[]> {
  try {
    const items = await directusItemsRequest<DirectusDownloadItem>({
      path: '/items/downloads',
      params: {
        fields: DOWNLOAD_FIELDS,
        sort: 'sort_order,title_en',
        filter: {
          status: { _eq: 'published' },
        },
      },
      tags: ['downloads'],
    });

    if (items?.length) return items.map((item) => mapDownload(item, locale));
  } catch {
    // graceful fallback below
  }

  if (locale === 'zh') {
    return fallbackDownloads.map((item) => ({
      ...item,
      title: item.id === 'catalog-001' ? '产品目录' : '技术数据表',
      description: item.id === 'catalog-001' ? '下载最新版公司产品目录。' : '下载关键规格和技术参考资料。',
    }));
  }

  return fallbackDownloads;
}
