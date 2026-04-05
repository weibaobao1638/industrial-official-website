#!/usr/bin/env python3
from _directus_api import request, wait_until_ready


def get_first(collection, filter_payload=None):
    params = ''
    if filter_payload:
        import json, urllib.parse
        params = '?filter=' + urllib.parse.quote(json.dumps(filter_payload))
    resp = request('GET', f'/items/{collection}{params}')
    data = resp.get('data', [])
    return data[0] if data else None


def create_if_missing(collection, payload, filter_payload=None):
    existing = get_first(collection, filter_payload)
    if existing:
        print(f'seed exists: {collection}')
        return existing
    created = request('POST', f'/items/{collection}', payload)
    print(f'seed created: {collection}')
    return created.get('data') if isinstance(created, dict) else created


def main():
    if not wait_until_ready():
        raise SystemExit('Directus not ready in time')

    create_if_missing('site_settings', {
        'site_name_zh': '工业企业官网',
        'site_name_en': 'Industrial Official Website',
        'company_name_zh': '工业企业有限公司',
        'company_name_en': 'Industrial Company Ltd.',
        'email': 'sales@example.com',
        'phone': '+86-000-0000-0000',
        'whatsapp': '+86-000-0000-0000',
        'wechat': 'company-wechat',
        'address_zh': '中国 · 工业园区示例地址',
        'address_en': 'Industrial Park, Example Address, China',
        'default_seo_title_zh': '工业企业官网',
        'default_seo_title_en': 'Industrial Official Website',
        'default_seo_description_zh': '面向海内外客户的工业企业官网。',
        'default_seo_description_en': 'Bilingual industrial company website.',
    })

    for page in [
        ('home', '工业产品与机械解决方案', 'Industrial Products & Mechanical Solutions'),
        ('about', '关于我们', 'About Us'),
        ('contact', '联系我们', 'Contact Us'),
        ('quote', '在线询价', 'Request for Quote'),
        ('downloads', '下载中心', 'Downloads'),
        ('certifications', '认证资质', 'Certifications'),
    ]:
        key, zh_title, en_title = page
        create_if_missing('pages', {
            'page_key': key,
            'title_zh': zh_title,
            'title_en': en_title,
            'subtitle_zh': f'{zh_title} 页面内容可在 Directus 中维护',
            'subtitle_en': f'{en_title} page content can be managed in Directus',
            'content_zh': f'这是 {zh_title} 的初始化内容，你可以直接在 Directus 后台继续修改。',
            'content_en': f'This is the initial content for {en_title}. You can continue editing it directly in Directus.',
            'seo_title_zh': zh_title,
            'seo_title_en': en_title,
            'seo_description_zh': f'{zh_title} 页面 SEO 描述。',
            'seo_description_en': f'SEO description for {en_title}.',
            'slug_zh': key,
            'slug_en': key,
            'status': 'published',
        }, {'page_key': {'_eq': key}})

    categories = [
        {'name_zh': '工业管道', 'name_en': 'Pipes', 'slug_zh': 'pipes', 'slug_en': 'pipes', 'status': 'published'},
        {'name_zh': '阀门产品', 'name_en': 'Valves', 'slug_zh': 'valves', 'slug_en': 'valves', 'status': 'published'},
        {'name_zh': '管件配件', 'name_en': 'Fittings', 'slug_zh': 'fittings', 'slug_en': 'fittings', 'status': 'published'},
    ]
    for cat in categories:
        create_if_missing('product_categories', cat, {'slug_en': {'_eq': cat['slug_en']}})

    industries = [
        {'name_zh': '水处理', 'name_en': 'Water Treatment', 'summary_zh': '适用于给排水和处理系统。', 'summary_en': 'Suitable for treatment and utility systems.', 'solution_content_zh': '这里可展示行业痛点与产品组合。', 'solution_content_en': 'Use this area to explain pain points and product combinations.', 'slug_zh': 'water-treatment', 'slug_en': 'water-treatment', 'status': 'published'},
        {'name_zh': '建筑工程', 'name_en': 'Construction', 'summary_zh': '适用于工程交付场景。', 'summary_en': 'Suitable for project delivery scenarios.', 'solution_content_zh': '这里可展示工程场景下的选型逻辑。', 'solution_content_en': 'Explain product selection logic for construction projects here.', 'slug_zh': 'construction', 'slug_en': 'construction', 'status': 'published'},
    ]
    for item in industries:
        create_if_missing('industries', item, {'slug_en': {'_eq': item['slug_en']}})

    products = [
        {
            'product_code': 'pipe-001', 'name_zh': '不锈钢工业管', 'name_en': 'Stainless Steel Pipe',
            'summary_zh': '适用于多种工业输送场景。', 'summary_en': 'Suitable for multiple industrial piping scenarios.',
            'description_zh': '这是一个初始化产品详情，可在 Directus 中继续补充。', 'description_en': 'This is an initial product description that can be extended in Directus.',
            'features_zh': '耐腐蚀\n稳定供货\n支持定制', 'features_en': 'Corrosion resistant\nStable supply\nOEM support',
            'applications_zh': '水处理\n建筑工程', 'applications_en': 'Water treatment\nConstruction',
            'material': 'Stainless Steel', 'specification': 'DN20-DN300 / SCH10-SCH40',
            'category_level_1': 'pipes', 'slug_zh': 'stainless-steel-pipe', 'slug_en': 'stainless-steel-pipe',
            'is_featured': True, 'status': 'published', 'sort_order': 1,
        },
        {
            'product_code': 'valve-001', 'name_zh': '工业闸阀', 'name_en': 'Industrial Gate Valve',
            'summary_zh': '适用于工业管路控制。', 'summary_en': 'Reliable flow control for industrial systems.',
            'description_zh': '初始化阀门产品内容。', 'description_en': 'Initial valve product content.',
            'features_zh': '结构稳定\n适配性强', 'features_en': 'Stable structure\nFlexible application',
            'applications_zh': '制造业\n管路系统', 'applications_en': 'Manufacturing\nPiping systems',
            'material': 'Carbon Steel', 'specification': 'Class 150 / PN16',
            'category_level_1': 'valves', 'slug_zh': 'industrial-gate-valve', 'slug_en': 'industrial-gate-valve',
            'is_featured': True, 'status': 'published', 'sort_order': 2,
        },
        {
            'product_code': 'fitting-001', 'name_zh': '弯头管件', 'name_en': 'Pipe Fitting Elbow',
            'summary_zh': '适用于工业管路转向连接。', 'summary_en': 'Durable fitting for directional piping connections.',
            'description_zh': '初始化管件内容。', 'description_en': 'Initial fitting content.',
            'features_zh': '连接稳定\n规格齐全', 'features_en': 'Stable connection\nMultiple specs',
            'applications_zh': '给排水\n工业制造', 'applications_en': 'Utility systems\nIndustrial manufacturing',
            'material': 'Stainless Steel / Carbon Steel', 'specification': '45° / 90°',
            'category_level_1': 'fittings', 'slug_zh': 'pipe-fitting-elbow', 'slug_en': 'pipe-fitting-elbow',
            'is_featured': True, 'status': 'published', 'sort_order': 3,
        },
    ]
    for item in products:
        create_if_missing('products', item, {'slug_en': {'_eq': item['slug_en']}})

    cases = [
        {'title_zh': '阿联酋水处理项目', 'title_en': 'Water System Project in UAE', 'summary_zh': '水处理项目产品供货案例。', 'summary_en': 'Supply case for a water treatment project.', 'background_zh': '客户需要稳定的工业管道产品。', 'background_en': 'The client needed stable industrial piping products.', 'solution_zh': '按项目安装和交付节奏提供产品组合。', 'solution_en': 'Products were aligned with project delivery and installation scheduling.', 'result_zh': '满足项目交付需求。', 'result_en': 'The delivery met project expectations.', 'country_id': 'UAE', 'slug_zh': 'water-system-project-uae', 'slug_en': 'water-system-project-uae', 'status': 'published'},
        {'title_zh': '泰国工厂升级案例', 'title_en': 'Factory Upgrade in Thailand', 'summary_zh': '生产线升级产品案例。', 'summary_en': 'Products used in production line upgrades.', 'background_zh': '客户希望提升产线稳定性。', 'background_en': 'The client wanted to improve line stability.', 'solution_zh': '提供匹配工况的阀门和机械部件。', 'solution_en': 'Valves and mechanical parts were matched to the operating environment.', 'result_zh': '改善维护效率。', 'result_en': 'Maintenance efficiency improved.', 'country_id': 'Thailand', 'slug_zh': 'factory-upgrade-thailand', 'slug_en': 'factory-upgrade-thailand', 'status': 'published'},
    ]
    for item in cases:
        create_if_missing('case_studies', item, {'slug_en': {'_eq': item['slug_en']}})

    blog_categories = [
        {'name_zh': '产品知识', 'name_en': 'product-knowledge', 'slug_zh': 'product-knowledge', 'slug_en': 'product-knowledge', 'status': 'published'},
        {'name_zh': '采购指南', 'name_en': 'buying-guide', 'slug_zh': 'buying-guide', 'slug_en': 'buying-guide', 'status': 'published'},
    ]
    for item in blog_categories:
        create_if_missing('blog_categories', item, {'slug_en': {'_eq': item['slug_en']}})

    blog_posts = [
        {'title_zh': '如何选择工业管道', 'title_en': 'How to Choose Industrial Pipes', 'excerpt_zh': '按材质、压力和应用选择。', 'excerpt_en': 'Choose by material, pressure, and application.', 'content_zh': '从应用场景开始，再逐步判断材质、压力等级和标准要求。', 'content_en': 'Start with the application, then narrow the choice by material, pressure, and compliance needs.', 'category_id': 'product-knowledge', 'slug_zh': 'how-to-choose-industrial-pipes', 'slug_en': 'how-to-choose-industrial-pipes', 'status': 'published'},
        {'title_zh': '不锈钢与碳钢怎么选', 'title_en': 'Stainless Steel vs Carbon Steel', 'excerpt_zh': '理解两种材料在不同项目中的差异。', 'excerpt_en': 'Understand the tradeoffs between two common materials.', 'content_zh': '不锈钢耐腐蚀更强，碳钢在部分场景下成本更友好。', 'content_en': 'Stainless steel offers stronger corrosion resistance, while carbon steel may fit cost-sensitive environments.', 'category_id': 'buying-guide', 'slug_zh': 'stainless-steel-vs-carbon-steel', 'slug_en': 'stainless-steel-vs-carbon-steel', 'status': 'published'},
    ]
    for item in blog_posts:
        create_if_missing('blog_posts', item, {'slug_en': {'_eq': item['slug_en']}})

    downloads = [
        {'title_zh': '产品目录', 'title_en': 'Product Catalog', 'description_zh': '公司产品目录下载。', 'description_en': 'Company product catalog.', 'file_type': 'PDF', 'download_category': 'catalog', 'status': 'published'},
        {'title_zh': '技术数据表', 'title_en': 'Technical Datasheet', 'description_zh': '技术参数资料。', 'description_en': 'Technical specification material.', 'file_type': 'PDF', 'download_category': 'datasheet', 'status': 'published'},
    ]
    for item in downloads:
        create_if_missing('downloads', item, {'title_en': {'_eq': item['title_en']}})

    certifications = [
        {'title_zh': 'ISO 质量认证', 'title_en': 'ISO Quality Certification', 'description_zh': '质量管理与生产控制能力证明。', 'description_en': 'Demonstrates quality management and production control.', 'certificate_type': 'ISO', 'issued_by': 'Authorized Body', 'valid_until': 'N/A', 'status': 'published'},
        {'title_zh': 'CE 认证', 'title_en': 'CE Certificate', 'description_zh': '出口合规相关资质。', 'description_en': 'Export-facing compliance credential.', 'certificate_type': 'CE', 'issued_by': 'Authorized Body', 'valid_until': 'N/A', 'status': 'published'},
    ]
    for item in certifications:
        create_if_missing('certifications', item, {'title_en': {'_eq': item['title_en']}})


if __name__ == '__main__':
    main()
