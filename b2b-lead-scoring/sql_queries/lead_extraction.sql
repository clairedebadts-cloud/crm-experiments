-- Lead Extraction & Scoring Query
-- This demonstrates how to extract and prepare lead data from a CRM system
-- Adapted for typical B2B SaaS CRM schema (Salesforce, HubSpot, etc.)

-- =====================================================
-- QUERY 1: Lead Extraction with Behavioral Signals
-- =====================================================

SELECT 
    l.lead_id,
    l.created_date,
    l.lead_source,
    l.lead_origin,
    l.industry,
    l.company_size,
    l.job_role,
    l.country,
    
    -- Engagement metrics
    l.total_visits,
    l.total_time_spent_on_website,
    l.page_views_per_visit,
    
    -- Activity signals
    l.last_activity_date,
    DATEDIFF(day, l.last_activity_date, CURRENT_DATE) as days_since_last_activity,
    
    -- Conversion signals
    CASE 
        WHEN l.lead_source IN ('Direct Traffic', 'Organic Search', 'Referral Sites') THEN 'Organic'
        WHEN l.lead_source IN ('Google', 'Facebook', 'Olark Chat') THEN 'Paid'
        ELSE 'Other'
    END as channel_category,
    
    -- Target variable
    l.converted as is_converted
    
FROM leads l
WHERE l.created_date >= DATEADD(month, -12, CURRENT_DATE)
    AND l.lead_status NOT IN ('Duplicate', 'Invalid')
ORDER BY l.created_date DESC;


-- =====================================================
-- QUERY 2: Lead Quality Scoring Based on Engagement
-- =====================================================

WITH lead_engagement AS (
    SELECT 
        lead_id,
        total_visits,
        total_time_spent_on_website,
        page_views_per_visit,
        
        -- Create engagement score (0-100)
        (
            CASE 
                WHEN total_visits >= 10 THEN 40
                WHEN total_visits >= 5 THEN 25
                WHEN total_visits >= 2 THEN 15
                ELSE 5
            END +
            CASE 
                WHEN total_time_spent_on_website >= 1000 THEN 30
                WHEN total_time_spent_on_website >= 500 THEN 20
                WHEN total_time_spent_on_website >= 100 THEN 10
                ELSE 0
            END +
            CASE 
                WHEN page_views_per_visit >= 5 THEN 30
                WHEN page_views_per_visit >= 3 THEN 20
                WHEN page_views_per_visit >= 2 THEN 10
                ELSE 0
            END
        ) as engagement_score
    FROM leads
)

SELECT 
    l.lead_id,
    l.lead_source,
    l.created_date,
    e.engagement_score,
    
    CASE 
        WHEN e.engagement_score >= 70 THEN 'Hot Lead'
        WHEN e.engagement_score >= 40 THEN 'Warm Lead'
        ELSE 'Cold Lead'
    END as lead_temperature,
    
    l.converted
    
FROM leads l
JOIN lead_engagement e ON l.lead_id = e.lead_id
ORDER BY e.engagement_score DESC;


-- =====================================================
-- QUERY 3: Data Quality Check
-- =====================================================

SELECT 
    'Total Leads' as metric,
    COUNT(*) as count,
    NULL as percentage
FROM leads

UNION ALL

SELECT 
    'Leads with Missing Email',
    COUNT(*),
    ROUND(100.0 * COUNT(*) / (SELECT COUNT(*) FROM leads), 2)
FROM leads
WHERE email IS NULL OR email = ''

UNION ALL

SELECT 
    'Leads with Missing Phone',
    COUNT(*),
    ROUND(100.0 * COUNT(*) / (SELECT COUNT(*) FROM leads), 2)
FROM leads
WHERE phone IS NULL OR phone = ''

UNION ALL

SELECT 
    'Leads with Missing Company Info',
    COUNT(*),
    ROUND(100.0 * COUNT(*) / (SELECT COUNT(*) FROM leads), 2)
FROM leads
WHERE company IS NULL OR company = ''

UNION ALL

SELECT 
    'Duplicate Lead Records',
    COUNT(*) - COUNT(DISTINCT email),
    ROUND(100.0 * (COUNT(*) - COUNT(DISTINCT email)) / COUNT(*), 2)
FROM leads
WHERE email IS NOT NULL;


-- =====================================================
-- QUERY 4: Lead Source Performance Analysis
-- =====================================================

SELECT 
    lead_source,
    COUNT(*) as total_leads,
    SUM(CASE WHEN converted = 1 THEN 1 ELSE 0 END) as converted_leads,
    ROUND(100.0 * SUM(CASE WHEN converted = 1 THEN 1 ELSE 0 END) / COUNT(*), 2) as conversion_rate,
    
    AVG(total_time_spent_on_website) as avg_time_on_site,
    AVG(total_visits) as avg_visits,
    
    -- Calculate lead quality score
    ROUND(
        (SUM(CASE WHEN converted = 1 THEN 1 ELSE 0 END) * 100.0 / COUNT(*)) *
        (AVG(total_time_spent_on_website) / 100),
    2) as quality_score
    
FROM leads
WHERE lead_source IS NOT NULL
GROUP BY lead_source
HAVING COUNT(*) >= 10  -- Only sources with sufficient volume
ORDER BY conversion_rate DESC, total_leads DESC;
