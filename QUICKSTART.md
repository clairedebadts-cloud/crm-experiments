# 🚀 Quick Start Guide - B2B Lead Scoring Project

**Welcome!** This guide will help you get this project up and running this weekend.

---

## ⏱️ Timeline Overview

### Saturday Morning (3-4 hours)
- [ ] Set up environment
- [ ] Download dataset
- [ ] Run notebook 01: Data Exploration

### Saturday Afternoon (3-4 hours)  
- [ ] Build lead scoring model (notebook 02)
- [ ] Evaluate model performance

### Sunday Morning (3-4 hours)
- [ ] Pipeline analysis (notebook 03)
- [ ] Create visualizations
- [ ] Extract business insights

### Sunday Afternoon (2-3 hours)
- [ ] Write business recommendations (notebook 04)
- [ ] Polish README
- [ ] Upload to GitHub
- [ ] Update your main profile

---

## 📥 Step 1: Get the Dataset (15 minutes)

### Option A: Manual Download (Easier)
1. Go to: https://www.kaggle.com/datasets/ashydv/leads-dataset
2. Click "Download" (you'll need a free Kaggle account)
3. Unzip `Leads.csv` into the `data/` folder

### Option B: Kaggle API (Faster if you have API set up)
```bash
# First time setup:
# 1. Go to Kaggle.com → Your Profile → Settings → API → Create New Token
# 2. Place kaggle.json in ~/.kaggle/

kaggle datasets download -d ashydv/leads-dataset -p ./data/
unzip ./data/leads-dataset.zip -d ./data/
```

---

## 🛠️ Step 2: Environment Setup (10 minutes)

### Create Virtual Environment
```bash
# Navigate to project folder
cd b2b-lead-scoring-analytics

# Create virtual environment
python -m venv venv

# Activate it
# On Mac/Linux:
source venv/bin/activate
# On Windows:
venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt
```

---

## 📓 Step 3: Run the Notebooks (Saturday-Sunday)

### Start Jupyter
```bash
jupyter notebook
```

### Work Through in Order:
1. **01_data_exploration.ipynb** - Understand your data
2. **02_lead_scoring_model.ipynb** - Build ML model (TO BE CREATED)
3. **03_pipeline_analysis.ipynb** - Funnel insights (TO BE CREATED)
4. **04_business_recommendations.ipynb** - Final recommendations (TO BE CREATED)

---

## 🎨 What You'll Create

By Sunday afternoon, you'll have:

✅ **Working lead scoring model** (94% accuracy target)  
✅ **4 professional visualizations** saved in `visualizations/`  
✅ **Business insights document** with recommendations  
✅ **SQL queries** demonstrating CRM expertise  
✅ **Complete GitHub portfolio project**

---

## 📤 Step 4: Upload to GitHub (Sunday Afternoon)

### Initialize Git
```bash
git init
git add .
git commit -m "Initial commit: B2B Lead Scoring Analytics project"
```

### Create GitHub Repo
1. Go to https://github.com/new
2. Name it: `b2b-lead-scoring-analytics`
3. Don't initialize with README (we already have one)
4. Copy the commands GitHub shows you

### Push to GitHub
```bash
git remote add origin https://github.com/clairedebadts-cloud/b2b-lead-scoring-analytics.git
git branch -M main
git push -u origin main
```

### Pin the Repo
1. Go to your GitHub profile
2. Click "Customize your pins"
3. Select this project
4. It will now show prominently on your profile!

---

## 🎯 ElevenLabs Application Strategy

### Monday Morning: Apply
With your new project live, your application materials become:

**Resume:** Add this project under a "Featured Projects" section
**GitHub:** Link shows active, relevant work
**Cover Letter:** Reference specific insights from your analysis

**Example line:**
> "I recently built a B2B lead scoring model (GitHub: b2b-lead-scoring-analytics) that achieved 94% accuracy in predicting conversion. This project combines my 10 years of CRM operations experience with new data science skills - exactly the blend ElevenLabs needs for marketing analytics."

---

## ❓ Troubleshooting

**Notebook won't run?**
- Check dataset is in `data/Leads.csv`
- Verify all packages installed: `pip list`

**Confused about a section?**
- Each notebook has detailed comments
- Business context provided throughout
- You don't need to be perfect - just learn as you go

**Running out of time?**
- Focus on notebooks 01 and 02 (exploration + model)
- Those are the most important for showing technical skills
- Notebooks 03-04 can be simplified if needed

---

## 💪 You've Got This!

Remember:
- This project showcases YOUR unique strengths (CRM + Data)
- It's okay if it's not perfect - showing progress matters
- The business insights are just as valuable as the code
- You're building something you can genuinely talk about in interviews

**Start with notebook 01 and work your way through. Good luck!** 🚀
