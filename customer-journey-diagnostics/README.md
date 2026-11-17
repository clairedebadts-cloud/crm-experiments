# Customer Journey Diagnostics *(in progress)*
 
**GA4 · BigQuery · Funnel analysis**
 
Where do online shoppers drop out between their first visit and a purchase, and which behaviours in a session predict that they will buy? This project works on Google's public GA4 sample of the Google Merchandise Store, queried in BigQuery.
 
---
 
## 📍 Where it stands
 
**Step 1, done:** exploring the GA4 event data and checking that sessions can be rebuilt from it.
 
A first look at event volumes along the shopping path:
 
| Step | Events |
|---|---|
| View a product | 386,068 |
| Add to cart | 58,543 |
| Start checkout | 38,757 |
| Add shipping details | 19,722 |
| Add payment details | 13,899 |
| Purchase | 5,692 |
 
These are raw event counts, not unique visitors or sessions, so they show where volume falls away rather than exact conversion rates. Rebuilding the funnel per session is the next step.
 
---
 
## 🧭 Next steps
 
1. **Rebuild sessions** and measure the real drop-off between each step.
2. **Model purchase likelihood** from session behaviour: pages seen, products viewed, time, device, traffic source.
3. **Turn drop-off points into CRM triggers:** browse abandonment after product views, cart abandonment after add to cart, and checkout abandonment after shipping or payment details.
---
 
## 🛠️ Stack
 
Python, BigQuery, pandas. The `journey_diagnostics/` package is set up for the modelling steps and will be filled in as the project moves on.
 
To run the notebook, set your own Google Cloud project ID in the first cell. The dataset is public: `bigquery-public-data.ga4_obfuscated_sample_ecommerce`.
 
