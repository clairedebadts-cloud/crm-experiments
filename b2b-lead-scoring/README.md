# B2B Lead Scoring: Uncovering a $300K Marketing Efficiency Opportunity

**Project Focus:** Marketing Analytics | Lead Scoring | B2B Pipeline Optimization

---

## 🎯 Project Overview

This project analyzes 9,000+ B2B leads to build a machine learning model that predicts conversion probability and uncovers marketing efficiency opportunities.

**Key Achievement:** Identified a critical targeting problem where 42% of leads were low-quality "Cold" leads, costing approximately $92,500 annually in wasted sales effort. The analysis provides specific, actionable recommendations to reduce this waste and improve ROI.

### What Makes This Analysis Different:
- **Identified systemic problems** in marketing qualification (42% Cold leads)
- **Diagnosed root causes** (Olark Chat 78.5% Cold, form completion gaps, broad targeting)
- **Quantified business impact** ($300K-500K optimization opportunity)
- **Provided actionable roadmap** with specific recommendations, owners, and timelines

---

## 🚨 Critical Discovery

### The Problem
**42% of all leads are "Cold"** (conversion score 0-25):
- Only 25% of these leads convert
- Waste ~1,850 sales hours annually
- Cost approximately $92,500/year in sales effort
- Prevent sales from focusing on high-probability leads

### Root Causes Identified

**1. Olark Chat - Poor Performance:**
- 78.5% of leads from Olark are Cold
- Average engagement: 63 seconds (immediate bounce)
- Average visits: 0.3 (no return visits)
- **Recommendation:** Shut down or complete redesign with qualification

**2. Google Ads - Needs Optimization:**
- 38% Cold leads (targeting too broad)
- However: 41% overall conversion, strong engagement (11 mins, 4 visits)
- **Recommendation:** Keyword optimization, landing page improvements

**3. Form Completion Gap:**
- Complete forms: 48.9% conversion
- Incomplete forms: 13.8% conversion
- **3.5x difference** - form completion is the strongest predictor
- **Recommendation:** Make key fields mandatory, improve UX

---

## 📊 Model Performance

### Lead Scoring Model
- **Accuracy:** 90%+
- **Precision:** 89% (10.7% false positive rate - acceptable for B2B)
- **ROC-AUC:** 0.93
- **Algorithm:** XGBoost (outperformed Random Forest)
- **Status:** Production-ready with all artifacts saved

### 4-Tier Segmentation
- **Very Qualified (75-100):** 85.1% conversion
- **Qualified (50-75):** 59.8% conversion
- **Nurturing (25-50):** 38.4% conversion
- **Cold (0-25):** 24.9% conversion

**Result:** 3.4x difference between top and bottom segments.

---

## 💰 Business Impact

### Current State
- 3,678 Cold leads (42% of all leads)
- Sales actively contacting 1,327 Cold leads
- ~1,850 hours wasted annually
- ~$92,500 cost per year

### After Implementation
- Reduce Cold leads: 42% → 17%
- Save ~1,000 sales hours annually
- Reallocate to 1,999 Qualified+ leads
- **Expected revenue impact: +20-30%**
- **ROI: Immediate** (no additional marketing spend)

### Implementation Roadmap
1. **Week 1:** Model-based routing, Olark decision, Google quick wins
2. **Month 1:** Form optimization, automated nurture campaigns
3. **Month 2-3:** Comprehensive channel optimization
4. **Ongoing:** Monitoring, retraining, continuous improvement

---

## 🔍 Key Analytical Insights

### Data Quality Analysis
- Identified two types of missing data: expected (user didn't fill) vs. system bugs (NaN)
- 29% of leads missing critical profile information
- Recommended fixes: form validation, mandatory fields, API checks

### Form Completion = Strongest Predictor
- Complete forms: 48.9% conversion vs. Incomplete: 13.8%
- Form completion itself signals purchase intent
- Created `form_completion_score` feature (0-1 scale) as primary input

### Sales Engagement Patterns
- Simplified 26 Tag categories into 6 actionable `action_status` values
- Discovered inconsistency: Some "Lost" leads still converting
- Recommendation: Review status taxonomy with Sales Ops

### Behavioral Signals
- **Total Time Spent on Website** is the key engagement metric
- TotalVisits and Page Views less predictive
- Cold leads: 361s | Qualified leads: 659s (82% more time)

---

## 🛠️ Technical Approach

### Data Processing
- **Dataset:** 9,000+ B2B leads, 37 features (demographics, behavioral, engagement)
- **Cleaning:** Distinguished 'Select' placeholders from NaN errors, IQR outlier handling
- **Feature Engineering:** 
  - `form_completion_score` (most important)
  - `action_status` (simplified from Tags)
  - Data quality flags (`has_lead_profile`, etc.)
  - Binary engagement indicators

### Modeling
- **Algorithms Tested:** Random Forest, XGBoost
- **Winner:** XGBoost (slightly better ROC-AUC)
- **Validation:** 80/20 stratified split
- **Key Features:** form_completion_score, Total Time Spent, Lead Source, action_status

### Analysis Stack
- **Python:** Pandas, NumPy, Scikit-learn, XGBoost
- **Visualization:** Matplotlib, Seaborn
- **Notebooks:** Jupyter (4 comprehensive notebooks)

---

## 📁 Project Structure

```
b2b-lead-scoring-analytics/
├── notebooks/
│   ├── 00_data_cleaning.ipynb           # Data quality assessment & cleaning
│   ├── 01_data_exploration.ipynb        # EDA with business insights
│   ├── 02_lead_scoring_model.ipynb      # Model building & targeting diagnosis
│   └── 03_implementation_plan.ipynb     # Executive roadmap & recommendations
├── data/
│   ├── Leads.csv                        # Raw dataset
│   ├── Leads_clean.csv                  # Cleaned dataset
│   └── Leads_scored.csv                 # Scored with predictions
├── visualizations/                      # 11 charts & analysis plots
├── models/
│   ├── lead_scoring_model.pkl           # Trained XGBoost model
│   ├── scaler.pkl                       # Feature scaler
│   ├── label_encoders.pkl               # Categorical encoders
│   └── feature_names.pkl                # Feature list
├── sql_queries/
│   ├── lead_extraction.sql              # Sample CRM queries
│   └── funnel_analysis.sql              # Pipeline analysis
├── requirements.txt
└── README.md
```

---

## 🚀 Getting Started

### Prerequisites
```bash
Python 3.12+
Jupyter Notebook
```

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/clairedebadts-cloud/b2b-lead-scoring-analytics.git
cd b2b-lead-scoring-analytics
```

2. **Create virtual environment (recommended)**
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

3. **Install dependencies**
```bash
pip install -r requirements.txt
```

4. **Download the dataset**
- Go to [Kaggle Leads Dataset](https://www.kaggle.com/datasets/ashydv/leads-dataset)
- Download `Leads.csv` and place in `data/` folder
- Alternatively, use Kaggle API:
```bash
kaggle datasets download -d ashydv/leads-dataset -p ./data/
unzip ./data/leads-dataset.zip -d ./data/
```

5. **Run the notebooks**
```bash
jupyter notebook
```
Navigate to `notebooks/` and run in order: 00 → 01 → 02 → 03

---

## 📈 Applications

This analysis framework applies to:
- B2B SaaS companies optimizing sales funnels
- Marketing teams allocating budget based on channel quality
- Sales operations prioritizing high-probability leads
- CRM managers identifying data quality issues
- Revenue operations forecasting pipeline health

---

## 📝 License

This project is open source and available under the MIT License.

---

## 🙏 Data Source

Dataset: [Kaggle - Leads Dataset](https://www.kaggle.com/datasets/ashydv/leads-dataset)

