import type { Locale } from '@/lib/constants/site';

export const dictionaries = {
  zh: {
    nav: {
      home: '首页',
      about: '关于我们',
      products: '产品中心',
      industries: '行业方案',
      cases: '案例中心',
      blog: '资讯博客',
      downloads: '下载中心',
      certifications: '认证资质',
      contact: '联系我们',
      quote: '在线询价',
    },
    common: {
      tagline: '工业产品与机械解决方案',
      getQuote: '获取报价',
      contactUs: '联系我们',
      learnMore: '了解更多',
      featuredProducts: '核心产品',
      industrySolutions: '行业方案',
      latestInsights: '最新内容',
    },
  },
  en: {
    nav: {
      home: 'Home',
      about: 'About',
      products: 'Products',
      industries: 'Industries',
      cases: 'Cases',
      blog: 'Blog',
      downloads: 'Downloads',
      certifications: 'Certifications',
      contact: 'Contact',
      quote: 'Get Quote',
    },
    common: {
      tagline: 'Industrial Products & Mechanical Solutions',
      getQuote: 'Get Quote',
      contactUs: 'Contact Us',
      learnMore: 'Learn More',
      featuredProducts: 'Featured Products',
      industrySolutions: 'Industry Solutions',
      latestInsights: 'Latest Insights',
    },
  },
} as const satisfies Record<Locale, unknown>;
