import React from "react";
import { BookOpen, CheckCircle2, HelpCircle, LifeBuoy, Rocket, Sparkles } from "lucide-react";

type HelpPageProps = {
  variant: "get-started" | "how-to" | "help-center";
};

const pageContent = {
  "get-started": {
    icon: Rocket,
    title: "Get Started",
    subtitle: "Set up your first workspace, build a form, and publish it in a few focused steps.",
    sections: [
      ["Create your workspace", "Use the workspace switcher in the sidebar to separate teams, clients, campaigns, or internal projects."],
      ["Build with blocks", "Start with a title, press Enter, then type / to add questions, uploads, ratings, headings, and dividers."],
      ["Add logic jumps", "On choice or dropdown questions, open Logic and route respondents to the next relevant question based on their answer."],
      ["Publish and share", "Publish the form, copy the share page, or embed it wherever your audience already is."],
    ],
  },
  "how-to": {
    icon: LifeBuoy,
    title: "How-to Guides",
    subtitle: "Practical workflows for building cleaner forms and getting better responses.",
    sections: [
      ["Build an intake form", "Use short answers for names, email blocks for contact details, file uploads for attachments, and required fields only where they matter."],
      ["Create a branching survey", "Add multiple choice questions, then set logic jumps so each answer skips irrelevant follow-up questions."],
      ["Review submissions", "Open All Forms, choose a form, then inspect individual responses or analytics for patterns."],
      ["Keep forms polished", "Use headings and dividers to group longer forms. Shorter sections usually convert better than a single wall of questions."],
    ],
  },
  "help-center": {
    icon: HelpCircle,
    title: "Help Center",
    subtitle: "Answers to common questions about publishing, responses, uploads, and account settings.",
    sections: [
      ["Where are my forms?", "Use All Forms from the sidebar. Newly published forms appear there with response counts and management links."],
      ["Why did a question disappear?", "A conditional rule or logic jump may be hiding it until the respondent selects the matching answer."],
      ["Can I change my profile?", "Open Profile from the account area or Settings to update your name and bio."],
      ["How do I manage billing?", "Go to Settings, then Billing & Plan. Pro billing is managed through the secure billing portal."],
    ],
  },
} as const;

const HelpPage: React.FC<HelpPageProps> = ({ variant }) => {
  const content = pageContent[variant];
  const Icon = content.icon;

  return (
    <div className="flex-1 overflow-y-auto bg-gray-50 px-4 py-8 lg:px-10">
      <div className="mx-auto max-w-5xl">
        <div className="rounded-[2rem] border border-gray-200 bg-white p-8 shadow-sm">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">
                <Icon size={24} />
              </div>
              <h1 className="text-3xl font-extrabold text-gray-950">{content.title}</h1>
              <p className="mt-3 max-w-2xl text-gray-500">{content.subtitle}</p>
            </div>
            <div className="rounded-3xl border border-gray-200 bg-gray-50 p-4 text-sm text-gray-600">
              <div className="flex items-center gap-2 font-semibold text-gray-900">
                <Sparkles size={16} />
                Formium basics
              </div>
              <p className="mt-2">Workspaces, blocks, logic, publishing, responses.</p>
            </div>
          </div>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-2">
          {content.sections.map(([title, body]) => (
            <section key={title} className="rounded-[1.75rem] border border-gray-200 bg-white p-6 shadow-sm">
              <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-2xl bg-gray-100 text-indigo-600">
                <CheckCircle2 size={20} />
              </div>
              <h2 className="text-lg font-bold text-gray-950">{title}</h2>
              <p className="mt-2 text-sm leading-6 text-gray-500">{body}</p>
            </section>
          ))}
        </div>

        <div className="mt-6 rounded-[1.75rem] border border-gray-200 bg-gray-100/70 p-6">
          <div className="flex items-center gap-3 text-gray-900">
            <BookOpen size={20} className="text-indigo-600" />
            <h2 className="text-lg font-bold">Recommended next step</h2>
          </div>
          <p className="mt-2 text-sm text-gray-600">
            Create a short test form with one multiple choice question and two logic jumps. Preview the response flow before sharing it with real respondents.
          </p>
        </div>
      </div>
    </div>
  );
};

export default HelpPage;
