"use client";

import type { WorksCategory } from "./projects";
import { WORKS_CATEGORIES } from "./projects";

type WorksCategoryFilterProps = {
  activeCategory: WorksCategory;
  onCategoryChange: (category: WorksCategory) => void;
};

export function WorksCategoryFilter({
  activeCategory,
  onCategoryChange,
}: WorksCategoryFilterProps) {
  return (
    <nav
      className="works-gallery__category-filter"
      aria-label="Filter projects by category"
    >
      <ul className="works-gallery__category-list" role="list">
        {WORKS_CATEGORIES.map((category) => {
          const isActive = category.id === activeCategory;

          return (
            <li key={category.id}>
              <button
                type="button"
                className={`works-gallery__category-tab${isActive ? " is-active" : ""}`}
                aria-current={isActive ? "true" : undefined}
                onClick={() => onCategoryChange(category.id)}
              >
                {category.label}
              </button>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
