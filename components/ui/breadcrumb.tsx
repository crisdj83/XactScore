import * as React from "react"
import Link from "next/link"
import { ChevronRight, Home } from "lucide-react"

import { cn } from "@/lib/utils"

export type BreadcrumbItem = {
  label: string
  href?: string
}

type BreadcrumbProps = {
  items: BreadcrumbItem[]
  className?: string
}

export function Breadcrumb({ items, className }: BreadcrumbProps) {
  return (
    <nav
      aria-label="Breadcrumb"
      className={cn(
        "flex w-fit max-w-full items-center gap-1.5 overflow-x-auto whitespace-nowrap rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-bold shadow-lg shadow-black/20 backdrop-blur-xl",
        className
      )}
    >
      <Link
        href="/"
        className="flex shrink-0 items-center gap-1 text-zinc-500 transition-colors duration-300 hover:text-zinc-100"
      >
        <Home className="h-3.5 w-3.5" />
      </Link>
      {items.map((item, index) => {
        const isLast = index === items.length - 1
        return (
          <React.Fragment key={`${item.label}-${index}`}>
            <ChevronRight className="h-3 w-3 shrink-0 text-zinc-700" />
            {item.href && !isLast ? (
              <Link
                href={item.href}
                className="shrink-0 text-zinc-500 transition-colors duration-300 hover:text-zinc-100"
              >
                {item.label}
              </Link>
            ) : (
              <span
                className={cn(
                  "shrink-0 truncate",
                  isLast
                    ? "text-zinc-900 dark:bg-gradient-to-r dark:bg-xactscore-accent dark:bg-clip-text dark:text-transparent"
                    : "text-zinc-500"
                )}
              >
                {item.label}
              </span>
            )}
          </React.Fragment>
        )
      })}
    </nav>
  )
}
