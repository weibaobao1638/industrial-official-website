import type { Locale } from '@/lib/constants/site';
import { directusItemsRequest } from '@/lib/directus/client';
import { getDirectusAssetUrl } from '@/lib/directus/assets';
import type { DirectusHomeBannerItem } from '@/types/directus';

export type HomeBannerItem = {
  id: string;
  imageUrl: string;
};

const HOME_BANNER_FIELDS = [
  'id',
  'image.id',
  'status',
  'sort_order',
].join(',');

function mapHomeBanner(item: DirectusHomeBannerItem, locale: Locale): HomeBannerItem | null {
  const imageId = typeof item.image === 'string' ? item.image : item.image?.id;
  const imageUrl = getDirectusAssetUrl(imageId);
  if (!imageUrl) return null;

  return {
    id: String(item.id),
    imageUrl,
  };
}

export async function getHomeBanners(locale: Locale): Promise<HomeBannerItem[]> {
  try {
    const items = await directusItemsRequest<DirectusHomeBannerItem>({
      path: '/items/home_banners',
      params: {
        fields: HOME_BANNER_FIELDS,
        sort: 'sort_order,id',
        filter: {
          status: { _eq: 'published' },
        },
      },
      tags: ['home_banners'],
      revalidate: 60,
    });

    return (items || [])
      .map((item) => mapHomeBanner(item, locale))
      .filter((item): item is HomeBannerItem => Boolean(item));
  } catch {
    return [];
  }
}
