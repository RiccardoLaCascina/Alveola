type PageTitleProps = { title: string; subtitle?: string };

export function PageTitle({ title, subtitle }: PageTitleProps) {
  return (
    <div className="mb-5">
      <h2 className="text-3xl font-extrabold">{title}</h2>
      {subtitle && <p className="mt-1 text-muted-foreground">{subtitle}</p>}
    </div>
  );
}
