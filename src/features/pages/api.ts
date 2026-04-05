import type { Locale } from '@/lib/constants/site';
import { directusItemsRequest } from '@/lib/directus/client';
import { getLocalizedField } from '@/lib/i18n/translated';
import type { DirectusPageItem } from '@/types/directus';

export type SitePageContent = {
  pageKey: string;
  title: string;
  subtitle: string;
  content: string;
  seoTitle: string;
  seoDescription: string;
  slug: string;
};

const PAGE_FIELDS = [
  'id',
  'page_key',
  'title_zh',
  'title_en',
  'subtitle_zh',
  'subtitle_en',
  'content_zh',
  'content_en',
  'seo_title_zh',
  'seo_title_en',
  'seo_description_zh',
  'seo_description_en',
  'slug_zh',
  'slug_en',
  'status',
].join(',');

const fallbackPages: Record<string, SitePageContent> = {
  home: {
    pageKey: 'home',
    title: 'Industrial Products & Mechanical Solutions',
    subtitle: 'Build trust with structured product pages, industry solutions, case studies, and a conversion-ready inquiry flow.',
    content:
      'Use this homepage record to control hero copy, company positioning, and other reusable marketing blocks from Directus.',
    seoTitle: 'Industrial Official Website',
    seoDescription: 'Bilingual industrial company website frontend skeleton.',
    slug: '',
  },
  about: {
    pageKey: 'about',
    title: 'About Us',
    subtitle: 'Factory, quality system, and export capability',
    content:
      'We focus on industrial products, structured product information, and reliable export delivery support.\n\nUse this page to present company profile, manufacturing capability, quality assurance, and project execution strength.',
    seoTitle: 'About Us',
    seoDescription: 'Company profile, factory capability, and quality system overview.',
    slug: 'about',
  },
  contact: {
    pageKey: 'contact',
    title: 'Contact Us',
    subtitle: 'Send your product requirements and RFQ details',
    content:
      'Use the inquiry form to contact the sales team.\n\nThis section can also include office address, regional contacts, and direct communication channels from Directus.',
    seoTitle: 'Contact Us',
    seoDescription: 'Contact the company through the inquiry form.',
    slug: 'contact',
  },
  quote: {
    pageKey: 'quote',
    title: 'Request for Quote',
    subtitle: 'Share your product list, specifications, and expected quantity',
    content:
      'Send your RFQ with product model, material, quantity, and technical requirements.\n\nThe team can use this page to guide buyers toward fast communication and conversion.',
    seoTitle: 'Request for Quote',
    seoDescription: 'Submit your product requirements and RFQ details.',
    slug: 'quote',
  },
  downloads: {
    pageKey: 'downloads',
    title: 'Downloads',
    subtitle: 'Catalogs, datasheets, certifications, and supporting documents',
    content:
      'Use this section to provide downloadable catalogs, datasheets, manuals, and company materials.\n\nStructured files help both buyers and search visibility.',
    seoTitle: 'Downloads',
    seoDescription: 'Catalogs, datasheets, and company materials.',
    slug: 'downloads',
  },
  certifications: {
    pageKey: 'certifications',
    title: 'Certifications',
    subtitle: 'Quality documents, compliance files, and trust-building materials',
    content:
      'Use this page to show ISO, CE, testing reports, and other compliance materials.\n\nThese items help buyers evaluate supplier credibility quickly.',
    seoTitle: 'Certifications',
    seoDescription: 'Company certifications and compliance materials.',
    slug: 'certifications',
  },
};

function mapPage(item: DirectusPageItem, locale: Locale): SitePageContent {
  return {
    pageKey: item.page_key || 'page',
    title: getLocalizedField(item, locale, 'title'),
    subtitle: getLocalizedField(item, locale, 'subtitle'),
    content: getLocalizedField(item, locale, 'content'),
    seoTitle: getLocalizedField(item, locale, 'seo_title') || getLocalizedField(item, locale, 'title'),
    seoDescription: getLocalizedField(item, locale, 'seo_description') || getLocalizedField(item, locale, 'subtitle'),
    slug: locale === 'zh' ? item.slug_zh || item.slug_en || item.page_key || 'page' : item.slug_en || item.slug_zh || item.page_key || 'page',
  };
}

export async function getPageContent(locale: Locale, pageKey: string): Promise<SitePageContent | null> {
  try {
    const items = await directusItemsRequest<DirectusPageItem>({
      path: '/items/pages',
      params: {
        fields: PAGE_FIELDS,
        limit: 1,
        filter: {
          status: { _eq: 'published' },
          page_key: { _eq: pageKey },
        },
      },
      tags: ['pages'],
    });

    if (items?.[0]) {
      return mapPage(items[0], locale);
    }
  } catch {
    // graceful fallback below
  }

  const fallback = fallbackPages[pageKey];
  if (!fallback) return null;

  if (locale === 'zh') {
    return {
      ...fallback,
      title:
        pageKey === 'home'
          ? '工业产品与机械解决方案'
          : pageKey === 'about'
            ? '关于我们'
            : pageKey === 'quote'
              ? '在线询价'
              : pageKey === 'downloads'
                ? '下载中心'
                : pageKey === 'certifications'
                  ? '认证资质'
            : '联系我们',
      subtitle:
        pageKey === 'home'
          ? '通过结构化产品页、行业方案、案例与询价流程建立客户信任。'
          : pageKey === 'about'
            ? '工厂实力、质量管理与出口能力'
            : pageKey === 'quote'
              ? '欢迎提交产品清单、规格和采购需求'
              : pageKey === 'downloads'
                ? '目录、技术资料和企业文件下载入口'
                : pageKey === 'certifications'
                  ? '认证文件、检测资料与合规证明展示'
            : '欢迎提交产品需求和询价信息',
      content:
        pageKey === 'home'
          ? '可在 Directus 中维护首页主视觉文案、品牌定位和核心营销信息。'
          : pageKey === 'about'
            ? '这里可用于展示公司介绍、生产能力、质量控制和海外交付经验。\n\n建议补充工厂图片、设备能力、认证体系与重点市场信息。'
            : pageKey === 'quote'
              ? '请提交产品型号、材质、数量、目标市场和其他技术需求。\n\n该页面适合承接广告、SEO 和产品详情页导流。'
              : pageKey === 'downloads'
                ? '这里适合展示目录、技术资料、说明书与宣传册下载。\n\n建议优先放置高价值产品目录和参数文件。'
                : pageKey === 'certifications'
                  ? '这里适合展示 ISO、CE、测试报告和其他资质文件。\n\n建议将高信任度文件优先展示。'
                  : '你可以通过下方询价表单联系销售团队，这里也可接入地图、联系人和区域销售卡片。',
      seoTitle:
        pageKey === 'home'
          ? '工业企业官网'
          : pageKey === 'about'
            ? '关于我们'
            : pageKey === 'quote'
              ? '在线询价'
              : pageKey === 'downloads'
                ? '下载中心'
                : pageKey === 'certifications'
                  ? '认证资质'
                  : '联系我们',
      seoDescription:
        pageKey === 'home'
          ? '面向海内外客户的工业企业官网前台骨架。'
          : pageKey === 'about'
            ? '公司实力、工厂能力与质量体系介绍。'
            : pageKey === 'quote'
              ? '提交产品需求、规格与采购信息。'
              : pageKey === 'downloads'
                ? '目录、参数表和企业资料下载。'
                : pageKey === 'certifications'
                  ? '企业认证和检测资料展示。'
            : '通过询价表单与我们联系。',
    };
  }

  return fallback;
}
