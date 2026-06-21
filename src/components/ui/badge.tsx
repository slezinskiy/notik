import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring",
  {
    variants: {
      variant: {
        default: "border-transparent bg-primary/10 text-primary hover:bg-primary/20",
        secondary: "border-transparent bg-secondary text-secondary-foreground",
        outline: "text-foreground",
        tag: "border-transparent bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300 cursor-pointer hover:bg-violet-200 dark:hover:bg-violet-900/50",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { badgeVariants };
