-- Funnel Analysis Queries
-- These queries demonstrate understanding of B2B conversion funnel mechanics
-- Typical stages: Lead → MQL → SQL → Opportunity → Customer

-- =====================================================
-- QUERY 1: Basic Conversion Funnel
-- =====================================================

WITH funnel_stages AS (
    SELECT 
        'Total Leads' as stage,
        1 as stage_order,
        COUNT(*) as count
    FROM leads
    
    UNION ALL
    
    SELECT 
        'Engaged Leads (2+ visits)',
        2,
        COUNT(*)
    FROM leads
    WHERE total_visits >= 2
    
    UNION ALL
    
    SELECT 
        'Marketing Qualified Leads',
        3,
        COUNT(*)
    FROM leads
    WHERE total_visits >= 3 
        AND total_time_spent_on_website >= 300
    
    UNION ALL
    
    SELECT 
        'Converted Customers',
        4,
        COUNT(*)
    FROM leads
    WHERE converted = 1
)

SELECT 
    stage,
    count,
    LAG(count) OVER (ORDER BY stage_order) as previous_stage_count,
    ROUND(100.0 * count / LAG(count) OVER (ORDER BY stage_order), 2) as conversion_rate,
    ROUND(100.0 * count / FIRST_VALUE(count) OVER (ORDER BY stage_order), 2) as cumulative_conversion
FROM funnel_stages
ORDER BY stage_order;


-- =====================================================
-- QUERY 2: Funnel Analysis by Lead Source
-- =====================================================

SELECT 
    lead_source,
    
    -- Stage 1: Total Leads
    COUNT(*) as total_leads,
    
    -- Stage 2: Engaged (2+ visits)
    SUM(CASE WHEN total_visits >= 2 THEN 1 ELSE 0 END) as engaged_leads,
    ROUND(100.0 * SUM(CASE WHEN total_visits >= 2 THEN 1 ELSE 0 END) / COUNT(*), 2) as engagement_rate,
    
    -- Stage 3: Qualified (3+ visits, 5+ min on site)
    SUM(CASE WHEN total_visits >= 3 AND total_time_spent_on_website >= 300 THEN 1 ELSE 0 END) as qualified_leads,
    ROUND(100.0 * SUM(CASE WHEN total_visits >= 3 AND total_time_spent_on_website >= 300 THEN 1 ELSE 0 END) / COUNT(*), 2) as qualification_rate,
    
    -- Stage 4: Converted
    SUM(CASE WHEN converted = 1 THEN 1 ELSE 0 END) as converted_customers,
    ROUND(100.0 * SUM(CASE WHEN converted = 1 THEN 1 ELSE 0 END) / COUNT(*), 2) as conversion_rate,
    
    -- Overall funnel efficiency
    ROUND(100.0 * SUM(CASE WHEN converted = 1 THEN 1 ELSE 0 END) / 
          SUM(CASE WHEN total_visits >= 2 THEN 1 ELSE 0 END), 2) as engaged_to_customer_rate

FROM leads
WHERE lead_source IS NOT NULL
GROUP BY lead_source
HAVING COUNT(*) >= 20
ORDER BY conversion_rate DESC;


-- =====================================================
-- QUERY 3: Time-Based Funnel Performance
-- =====================================================

WITH monthly_funnel AS (
    SELECT 
        DATE_TRUNC('month', created_date) as month,
        COUNT(*) as total_leads,
        SUM(CASE WHEN total_visits >= 2 THEN 1 ELSE 0 END) as engaged,
        SUM(CASE WHEN converted = 1 THEN 1 ELSE 0 END) as converted
    FROM leads
    WHERE created_date >= DATEADD(month, -12, CURRENT_DATE)
    GROUP BY DATE_TRUNC('month', created_date)
)

SELECT 
    month,
    total_leads,
    engaged,
    converted,
    ROUND(100.0 * engaged / total_leads, 2) as engagement_rate,
    ROUND(100.0 * converted / total_leads, 2) as conversion_rate,
    
    -- Month-over-month changes
    total_leads - LAG(total_leads) OVER (ORDER BY month) as leads_change,
    ROUND(
        100.0 * (converted - LAG(converted) OVER (ORDER BY month)) / 
        NULLIF(LAG(converted) OVER (ORDER BY month), 0),
    2) as conversion_growth_rate
    
FROM monthly_funnel
ORDER BY month DESC;


-- =====================================================
-- QUERY 4: Bottleneck Analysis - Where Are We Losing Leads?
-- =====================================================

WITH lead_categorization AS (
    SELECT 
        lead_id,
        lead_source,
        
        -- Classify lead progression
        CASE 
            WHEN converted = 1 THEN 'Converted'
            WHEN total_visits >= 3 AND total_time_spent_on_website >= 300 THEN 'Qualified - Not Converted'
            WHEN total_visits >= 2 THEN 'Engaged - Not Qualified'
            ELSE 'Not Engaged'
        END as funnel_position,
        
        total_visits,
        total_time_spent_on_website,
        page_views_per_visit
        
    FROM leads
)

SELECT 
    funnel_position,
    COUNT(*) as lead_count,
    ROUND(100.0 * COUNT(*) / SUM(COUNT(*)) OVER(), 2) as percentage,
    
    -- Average engagement metrics for each stage
    ROUND(AVG(total_visits), 2) as avg_visits,
    ROUND(AVG(total_time_spent_on_website), 2) as avg_time_on_site,
    ROUND(AVG(page_views_per_visit), 2) as avg_pages_per_visit,
    
    -- Top sources at this stage
    STRING_AGG(DISTINCT lead_source, ', ') as common_sources
    
FROM lead_categorization
GROUP BY funnel_position
ORDER BY 
    CASE funnel_position
        WHEN 'Converted' THEN 1
        WHEN 'Qualified - Not Converted' THEN 2
        WHEN 'Engaged - Not Qualified' THEN 3
        WHEN 'Not Engaged' THEN 4
    END;


-- =====================================================
-- QUERY 5: Lead Velocity & Pipeline Health
-- =====================================================

SELECT 
    lead_source,
    
    -- Volume metrics
    COUNT(*) as total_leads,
    COUNT(*) / 
        NULLIF(DATEDIFF(day, MIN(created_date), MAX(created_date)), 0) 
        as leads_per_day,
    
    -- Conversion metrics
    SUM(CASE WHEN converted = 1 THEN 1 ELSE 0 END) as conversions,
    ROUND(100.0 * SUM(CASE WHEN converted = 1 THEN 1 ELSE 0 END) / COUNT(*), 2) as conversion_rate,
    
    -- Velocity metrics (days to convert)
    ROUND(AVG(
        CASE 
            WHEN converted = 1 
            THEN DATEDIFF(day, created_date, last_activity_date)
            ELSE NULL 
        END
    ), 1) as avg_days_to_convert,
    
    -- Pipeline health score (volume * conversion rate * velocity)
    ROUND(
        (COUNT(*) / 100.0) * 
        (SUM(CASE WHEN converted = 1 THEN 1 ELSE 0 END) * 100.0 / COUNT(*)) /
        NULLIF(AVG(CASE WHEN converted = 1 THEN DATEDIFF(day, created_date, last_activity_date) ELSE NULL END), 0),
    2) as pipeline_health_score
    
FROM leads
WHERE created_date >= DATEADD(month, -6, CURRENT_DATE)
    AND lead_source IS NOT NULL
GROUP BY lead_source
HAVING COUNT(*) >= 10
ORDER BY pipeline_health_score DESC;
