"use client";

import { useState } from "react";
import "@/styles/checkout.css";
import { useBuilderStore } from "@/store/builderStore"; 

type CheckoutClientProps = {
  websiteId: string;
  websiteName: string;
  templateName: string;
  themeName: string;
  businessName: string;
};

const STRIPE_PRICE_IDS = {
  basic: {
    monthly: "price_1SOhYyQaFhkWD362FDisrEdv",
    yearly: "price_1SOhhGQaFhkWD3625hb3rV0Z",
  },
  standard: {
    monthly: "price_1SOhiPQaFhkWD3627UspQ1pA",
    yearly: "price_1SOhkTQaFhkWD362P0GN4nLy",
  },
  premium: {
    monthly: "price_1SOhn6QaFhkWD362CZtZPwLG",
    yearly: "price_1SOhquQaFhkWD362y31CGore",
  },
};

export function CheckoutClient({
  websiteId,
  websiteName,
  templateName,
  themeName,
  businessName,
}: CheckoutClientProps) {
  const [isYearly, setIsYearly] = useState(false);
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);
  
  // ✅ Use stable selectors - don't create new object inline
const values = useBuilderStore((s) => s.content);
const theme = useBuilderStore((s) => s.themeConfig);

  const handleToggle = () => setIsYearly(!isYearly);

  const plans = [
    {
      id: "basic",
      title: "Basic Plan — \"Get Online\"",
      monthlyPrice: "300 MAD / month",
      yearlyPrice: "3,000 MAD / year",
      yearlyNote: "→ 2 months free",
      description:
        "Perfect for small websites or startups that just need a solid online presence.",
      features: [
        "Secure hosting + free domain & SSL",
        "Automatic updates & backups",
        "Basic SEO setup so your site appears on Google",
        "Monthly report showing your traffic & rankings",
      ],
      goal:
        "Keep your site online, protected, and visible — without doing the tech work yourself.",
    },
    {
      id: "standard",
      title: "Standard Plan — \"Grow Online\"",
      monthlyPrice: "600 MAD / month",
      yearlyPrice: "6,000 MAD / year",
      yearlyNote: "→ 2 months free",
      description:
        "Perfect for growing businesses that want more visitors and better rankings.",
      features: [
        "Everything in Basic, plus:",
        "Faster support + monthly content edits",
        "Advanced security & local SEO (Google Maps setup)",
        "1 new blog post per month",
        "AI-assisted SEO to boost performance automatically",
        "Detailed monthly reports with progress insights",
      ],
      goal:
        "Help your site grow in Google and bring in real customers.",
    },
    {
      id: "premium",
      title: "Premium Plan — \"Dominate Online\"",
      monthlyPrice: "1,200 MAD / month",
      yearlyPrice: "12,000 MAD / year",
      yearlyNote: "→ save big",
      description:
        "Perfect for businesses ready to scale fast and lead their market.",
      features: [
        "Everything in Standard, plus:",
        "Premium high-speed hosting + priority support",
        "Full content strategy + multiple blog posts/month",
        "AI-powered SEO agent working 24/7",
        "Multilingual & local SEO (multi-city/language)",
        "Quarterly strategy meetings + detailed reports",
      ],
      goal:
        "Become a top-ranking brand online with AI + expert support working for you.",
    },
  ];

  async function handleCheckout(planId: string) {
    try {
      setLoadingPlan(planId);

      const priceId = STRIPE_PRICE_IDS[planId as keyof typeof STRIPE_PRICE_IDS][
        isYearly ? "yearly" : "monthly"
      ];
      
      const billingCycle = isYearly ? "yearly" : "monthly";

      const res = await fetch("/api/checkout_sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
body: JSON.stringify({
  priceId,
  websiteId,
  planId,
  billingCycle,
  values,
  theme,
}),

      });

      const data = await res.json();

      if (data.url) {
        window.location.href = data.url;
      } else {
        alert("Error: could not start checkout session.");
        console.error(data);
      }
    } catch (error) {
      console.error(error);
      alert("Something went wrong. Please try again later.");
    } finally {
      setLoadingPlan(null);
    }
  }

  return (
    <div className="checkout-container">
      <header className="checkout-header">
        <h1>Choose the plan that fits your growth</h1>
        <p>
          Template <strong>{templateName}</strong> · Theme <strong>{themeName}</strong> ·
          Business <strong>{businessName}</strong>
        </p>

        <div className="billing-toggle">
          <span className={`label ${!isYearly ? "active" : ""}`}>Monthly</span>
          <label className="switch">
            <input type="checkbox" checked={isYearly} onChange={handleToggle} />
            <span className="slider"></span>
          </label>
          <span className={`label ${isYearly ? "active" : ""}`}>Yearly</span>
        </div>
      </header>

      <div className="pricing-cards">
        {plans.map((plan) => (
          <div className="pricing-card" key={plan.id}>
            <h2>{plan.title}</h2>
            <div className="price">
              {isYearly ? plan.yearlyPrice : plan.monthlyPrice}
            </div>
            {isYearly && <div className="savings">{plan.yearlyNote}</div>}
            <p className="description">{plan.description}</p>
            <ul className="features">
              {plan.features.map((f, i) => (
                <li key={i}>{f}</li>
              ))}
            </ul>
            <p className="goal">{plan.goal}</p>
            <button
              className="btn-primary"
              onClick={() => handleCheckout(plan.id)}
              disabled={loadingPlan === plan.id}
            >
              {loadingPlan === plan.id ? "Redirecting..." : "Select Plan"}
            </button>
          </div>
        ))}
      </div>

      <footer className="checkout-footer">
        <p>
          Need a hand choosing the right plan? Reach us at{" "}
          <a href="mailto:support@prosite.com">support@prosite.com</a> and we&apos;ll
          guide you.
        </p>
        <p className="security-note">Secure checkout powered by Stripe.</p>
      </footer>
    </div>
  );
}