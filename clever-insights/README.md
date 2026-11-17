Clever Insights: Campaign Health Monitor for CleverTap

CRM monitoring · Deliverability · AI recommendations

A dashboard that watches every CleverTap campaign across email, push, SMS and in-app, flags the ones going wrong, and suggests what to do about it. The idea: catch a deliverability or performance problem in days, not at the end-of-month report.

🔎 What it checks

Each campaign is compared with the average for its channel, and with fixed thresholds you can change in the settings:

Check	Default trigger	When it alerts
Deliverability drop	Delivery rate 10% below the channel average	Straight away
Performance drop	Open rate or click rate 10% below the channel average	After 3 days, once the campaign has had time to perform
Email bounces	Bounce rate above 5%	On the dashboard
Push delivery	Delivery rate below 80%	On the dashboard
Low opens	Open rate under half the channel average	On the dashboard
Over-messaging	3 campaigns to the same segment within 7 days	On the dashboard

It also previews the alert email and a weekly recap for the marketing team.

🤖 AI recommendations

For each issue, Claude writes a short, specific recommendation that refers to the campaign's actual numbers. Some guardrails keep it safe and cheap:

No personal data goes in. The model only sees the channel, the rates, the issue and a rounded segment size. Segments under 50 people are hidden, and emails or phone numbers are removed from any text.
The answer is checked. It has to come back in a fixed format and can only cite metrics it was given.
Costs are capped. At most 50 recommendations a day, and after 30 it switches to the smaller, cheaper model.
🛠️ How it's built
Front end: React, TypeScript, Vite, Tailwind, shadcn/ui (started in Lovable)
Data: CleverTap REST API, read-only, or built-in demo data
AI: Anthropic API through a small serverless function
Tests: Vitest for the recommendation logic
Run it
bash
npm install
npm run dev

Open the app and choose the demo data, or connect a CleverTap account with its account ID and passcode. AI recommendations need an ANTHROPIC_API_KEY set for the serverless function.
Yes, you can!

To connect a domain, navigate to Project > Settings > Domains and click Connect Domain.

Read more here: [Setting up a custom domain](https://docs.lovable.dev/features/custom-domain#custom-domain)
