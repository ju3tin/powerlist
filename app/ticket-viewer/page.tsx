import TicketViewer from "./TicketViewer";

type PageProps = {
  searchParams: Promise<{
    title?: string;
    id?: string;
    featured_image?: string;
  }>;
};

export default async function TicketViewerPage({
  searchParams,
}: PageProps) {
  const params = await searchParams;

  const title = params.title || "Rachel Logan";
  const id = params.id || "400724";
  const featuredImage = params.featured_image || "";

  return (
    <html>
        <head></head>
           
    <body>
    <TicketViewer
      title={title}
      id={id}
      featuredImage={featuredImage}
    /></body></html>
  );
}