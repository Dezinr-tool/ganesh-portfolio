"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeSlug from "rehype-slug";
import type { Components } from "react-markdown";
import {
  ProposalCover,
  ProposalFooter,
  ProposalSidebar,
  ProposalTopbar,
} from "./proposal-chrome";
import { PHONEPE_PROPOSAL_SECTIONS } from "./sections";

gsap.registerPlugin(ScrollTrigger);

type ProposalDocumentProps = {
  markdown: string;
};

const mdComponents: Components = {
  table: ({ children, ...props }) => (
    <div className="phonepe-proposal-table-wrap">
      <table {...props}>{children}</table>
    </div>
  ),
  h2: ({ children, id, ...props }) => (
    <h2 id={id} className="phonepe-proposal-section" {...props}>
      {children}
    </h2>
  ),
};

export function ProposalDocument({ markdown }: ProposalDocumentProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = scrollRef.current;
    if (!root) return;

    const scrollToHash = (hash: string, smooth = true) => {
      const id = hash.replace(/^#/, "");
      if (!id) return;
      const el = root.querySelector<HTMLElement>(`#${CSS.escape(id)}`);
      if (!el) return;
      const topbar = 56;
      const top =
        el.getBoundingClientRect().top -
        root.getBoundingClientRect().top +
        root.scrollTop -
        topbar;
      root.scrollTo({ top: Math.max(0, top), behavior: smooth ? "smooth" : "auto" });
    };

    const onClick = (e: MouseEvent) => {
      const anchor = (e.target as HTMLElement).closest<HTMLAnchorElement>(
        'a[href^="#"]',
      );
      if (!anchor || !root.contains(anchor)) return;
      const hash = anchor.getAttribute("href");
      if (!hash || hash === "#") return;
      e.preventDefault();
      scrollToHash(hash, true);
      window.history.replaceState(null, "", hash);
    };

    root.addEventListener("click", onClick);

    if (window.location.hash) {
      requestAnimationFrame(() => scrollToHash(window.location.hash, false));
    }

    return () => root.removeEventListener("click", onClick);
  }, [markdown]);

  useEffect(() => {
    const root = scrollRef.current;
    if (!root) return;

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reducedMotion) return;

    const sections = root.querySelectorAll<HTMLElement>(".phonepe-proposal-section");
    sections.forEach((el) => el.classList.add("is-pending"));

    const ctx = gsap.context(() => {
      sections.forEach((section) => {
        gsap.fromTo(
          section,
          { opacity: 0, y: 20 },
          {
            opacity: 1,
            y: 0,
            duration: 0.55,
            ease: "power2.out",
            scrollTrigger: {
              trigger: section,
              scroller: root,
              start: "top 88%",
              toggleActions: "play none none none",
            },
          },
        );
      });
    }, root);

    return () => ctx.revert();
  }, [markdown]);

  useEffect(() => {
    const root = scrollRef.current;
    if (!root) return;

    const navLinks = document.querySelectorAll<HTMLAnchorElement>(
      ".phonepe-proposal-nav a",
    );
    const headings = PHONEPE_PROPOSAL_SECTIONS.map(({ id }) =>
      root.querySelector<HTMLElement>(`#${CSS.escape(id)}`),
    ).filter(Boolean) as HTMLElement[];

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (!visible?.target.id) return;
        navLinks.forEach((link) => {
          link.classList.toggle(
            "is-active",
            link.dataset.section === visible.target.id,
          );
        });
      },
      { root, rootMargin: "-20% 0px -65% 0px", threshold: [0, 0.25, 0.5] },
    );

    headings.forEach((h) => observer.observe(h));
    return () => observer.disconnect();
  }, [markdown]);

  const handlePrint = () => window.print();

  return (
    <div className="phonepe-proposal-root">
      <ProposalTopbar onPrint={handlePrint} />
      <div ref={scrollRef} className="phonepe-proposal-scroll">
        <ProposalCover />
        <div className="phonepe-proposal-layout">
          <ProposalSidebar />
          <main className="phonepe-proposal-main" id="main-content">
            <article className="phonepe-proposal-article phonepe-proposal-md">
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                rehypePlugins={[rehypeSlug]}
                components={mdComponents}
              >
                {markdown}
              </ReactMarkdown>
            </article>
            <ProposalFooter />
          </main>
        </div>
      </div>
    </div>
  );
}
