type PersonLike = {
    title: string;
    id: number | string;
    artist_title?: string;
    power_list_category?: string;
    featured_image?: string;
    company_logo?: string;
    social_icons?: { icon_type: string; social_network_url: string }[];
  };
  
  export function buildTicketPreviewUrl(
    person: PersonLike,
    year = "2026"
  ): string {
    const params = new URLSearchParams();
  
    params.set("name", person.title);
    params.set("tokenId", String(person.id));
    params.set("year", year);
  
    if (person.artist_title) params.set("role", person.artist_title);
    if (person.power_list_category) {
      params.set("category", person.power_list_category);
    }
    if (person.featured_image) params.set("imageUrl", person.featured_image);
  
    if (person.company_logo && person.company_logo !== "false") {
      params.set("companyLogo", person.company_logo);
    }
  
    const linkedin = person.social_icons?.find(
      (s) => s.icon_type === "linkedin"
    )?.social_network_url;
    if (linkedin) params.set("linkedinUrl", linkedin);
  
    return `/ticket/preview?${params.toString()}`;
  }