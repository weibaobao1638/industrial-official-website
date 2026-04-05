import type { Locale } from '@/lib/constants/site';
import { getDirectusAssetUrl } from '@/lib/directus/assets';
import { directusItemsRequest } from '@/lib/directus/client';
import { getLocalizedField } from '@/lib/i18n/translated';
import type { DirectusCertificationItem } from '@/types/directus';

export type CertificationItem = {
  id: string;
  title: string;
  description: string;
  type: string;
  issuedBy: string;
  validUntil: string;
  fileUrl: string | null;
  fileName?: string;
  imageUrl: string | null;
};

const CERTIFICATION_FIELDS = [
  'id',
  'title_zh',
  'title_en',
  'description_zh',
  'description_en',
  'certificate_type',
  'issued_by',
  'valid_until',
  'file.id',
  'file.filename_download',
  'image.id',
  'status',
].join(',');

const fallbackCertifications: CertificationItem[] = [
  {
    id: 'iso-001',
    title: 'ISO Quality Certification',
    description: 'Demonstrates structured quality management and production control.',
    type: 'ISO',
    issuedBy: 'Authorized Body',
    validUntil: 'N/A',
    fileUrl: null,
    fileName: 'iso-certificate.pdf',
    imageUrl: null,
  },
  {
    id: 'ce-001',
    title: 'CE Certificate',
    description: 'Supports export-facing compliance communication.',
    type: 'CE',
    issuedBy: 'Authorized Body',
    validUntil: 'N/A',
    fileUrl: null,
    fileName: 'ce-certificate.pdf',
    imageUrl: null,
  },
];

function resolveAssetUrl(asset: DirectusCertificationItem['file'] | DirectusCertificationItem['image']) {
  if (!asset) return null;
  if (typeof asset === 'string') return getDirectusAssetUrl(asset);
  return getDirectusAssetUrl(asset.id);
}

function mapCertification(item: DirectusCertificationItem, locale: Locale): CertificationItem {
  return {
    id: String(item.id),
    title: getLocalizedField(item, locale, 'title'),
    description: getLocalizedField(item, locale, 'description'),
    type: item.certificate_type || 'Certification',
    issuedBy: item.issued_by || '',
    validUntil: item.valid_until || '',
    fileUrl: resolveAssetUrl(item.file),
    fileName: typeof item.file === 'object' ? item.file?.filename_download : undefined,
    imageUrl: resolveAssetUrl(item.image),
  };
}

export async function getCertifications(locale: Locale): Promise<CertificationItem[]> {
  try {
    const items = await directusItemsRequest<DirectusCertificationItem>({
      path: '/items/certifications',
      params: {
        fields: CERTIFICATION_FIELDS,
        sort: 'sort_order,title_en',
        filter: {
          status: { _eq: 'published' },
        },
      },
      tags: ['certifications'],
    });

    if (items?.length) return items.map((item) => mapCertification(item, locale));
  } catch {
    // graceful fallback below
  }

  if (locale === 'zh') {
    return fallbackCertifications.map((item) => ({
      ...item,
      title: item.type === 'ISO' ? 'ISO 质量认证' : 'CE 认证',
      description: item.type === 'ISO' ? '展示公司质量管理与生产控制能力。' : '用于出口合规沟通与客户信任建立。',
      issuedBy: '认证机构',
    }));
  }

  return fallbackCertifications;
}
