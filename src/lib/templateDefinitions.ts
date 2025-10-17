export type TemplateContentFieldMeta = {
  label: string;
  default: string;
  helper?: string;
  type?: "textarea" | "email" | "text";
};

export type TemplateContentSectionMeta = {
  title: string;
  description?: string;
};

export type TemplateMeta = {
  content: Record<string, TemplateContentFieldMeta>;
  contentSections?: Record<string, TemplateContentSectionMeta>;
};

export type TemplateDefinition = {
  id: string;
  name: string;
  description: string;
  category: string;
  pages: string[];
  swatches: string[];
  htmlFile: string;
  cssFile: string;
  meta: TemplateMeta;
};

export const templates: TemplateDefinition[] = [
  {
    id: "portfolio-creative",
    name: "Portfolio Creative",
    description: "Bold single-page portfolio ideal for designers and agencies.",
    category: "Creative Portfolio",
    pages: ["Hero", "About", "Experience", "Portfolio", "Testimonials", "Contact"],
    swatches: ["#38bdf8", "#0ea5e9", "#f472b6"],
    htmlFile: "index.html",
    cssFile: "style.css",
    meta: {
      contentSections: {
        "hero": {
          title: "Hero",
          description: "Craft the first impression visitors see when they land on your site."
        },
        "about": {
          title: "About",
          description: "Share your story and what sets you apart."
        },
        "experience": {
          title: "Experience",
          description: "Summarize your professional highlights."
        },
        "portfolio": {
          title: "Portfolio",
          description: "Introduce the work you want prospects to explore."
        },
        "testimonials": {
          title: "Testimonials",
          description: "Let social proof build trust for you."
        },
        "contact": {
          title: "Contact",
          description: "Make it easy for clients to reach out."
        }
      },
      content: {
        "hero.headline": {
          label: "Hero headline",
          helper: "Displayed prominently in the hero banner.",
          default: "Avery Johnson"
        },
        "hero.tagline": {
          label: "Hero tagline",
          helper: "A concise statement of your value.",
          default: "Product Designer & Art Director"
        },
        "about.body": {
          label: "About section",
          type: "textarea",
          helper: "Appears beneath the About heading.",
          default:
            "I craft immersive digital experiences and lead cross-functional teams to deliver design systems that scale."
        },
        "experience.title": {
          label: "Experience section title",
          default: "Experience"
        },
        "experience.summary": {
          label: "Experience summary",
          type: "textarea",
          default: "Previously at Pixelwave Studio, Dataloom, and Nova Labs."
        },
        "portfolio.heading": {
          label: "Portfolio heading",
          default: "Selected Work"
        },
        "testimonials.quote": {
          label: "Testimonial quote",
          type: "textarea",
          default: "Working with Avery elevated our brand presence tenfold."
        },
        "testimonials.author": {
          label: "Testimonial author",
          default: "Jordan Smith, CEO at Nova Labs"
        },
        "contact.headline": {
          label: "Contact headline",
          default: "Let’s build something iconic."
        },
        "contact.email": {
          label: "Contact email",
          type: "email",
          default: "hello@averyjohnson.design"
        }
      }
    }
  }
];
