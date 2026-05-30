import { getActiveConfig } from "@/lib/getConfig";
import { notFound } from "next/navigation";
import LocalSEO from "@/components/LocalSEO";
import PendingApproval from "@/components/PendingApproval";
import { getThemeStyles } from "@/lib/theme";
import { getSiteGate } from "@/lib/siteGate";
import { cookies } from "next/headers";
import Image from "next/image";

export default async function SubPage({ 
  params 
}: { 
  params: Promise<{ hostname: string, slug: string }> 
}) {
  const resolvedParams = await params;
  const config = await getActiveConfig(resolvedParams.hostname);

  if (!config || !config.pagesConfig) {
    notFound();
  }

  // Mirror the home-page gate: suspended/pending tenants must not expose their
  // sub-pages to the public either.
  const cookieStore = await cookies();
  const isAdminBypass = cookieStore.get('admin_bypass')?.value === 'true';
  const gate = getSiteGate(config, isAdminBypass);

  if (gate === 'blocked') {
    notFound();
  }

  if (gate === 'pending') {
    return (
      <>
        <LocalSEO seo={config.seo} brandName={config.brandName} url={`https://${resolvedParams.hostname}/${resolvedParams.slug}`} />
        <PendingApproval />
      </>
    );
  }

  const pageData = config.pagesConfig.find(p => p.slug === `/${resolvedParams.slug}` || p.slug === resolvedParams.slug);
  
  if (!pageData) {
    notFound();
  }

  const theme = getThemeStyles(config.theme);

  return (
    <>
      <LocalSEO 
        seo={{...config.seo, legalName: `${pageData.title} | ${config.seo.legalName}`}} 
        brandName={config.brandName} 
        url={`https://${resolvedParams.hostname}/${resolvedParams.slug}`} 
      />
      
      <main className="bg-neutral-900 min-h-screen text-white">
        {/* Hero Section */}
        <section className="relative flex min-h-[60vh] md:min-h-[70vh] items-center justify-center overflow-hidden">
          <div className="absolute inset-0 z-0">
            <Image
              src={pageData.hero.backgroundImage || 'https://images.unsplash.com/photo-1558211583-d26f610c1eb1'}
              alt={pageData.hero.headline}
              fill
              className="object-cover"
              priority
            />
            <div className={`absolute inset-0 ${theme.heroGradient}`} />
            {/* Add extra dark overlay for subpages to ensure nav visibility */}
            <div className="absolute inset-0 bg-black/40" />
          </div>
          
          <div className="relative z-10 mx-auto max-w-5xl px-6 text-center mt-16">
            <h1 className={`text-4xl md:text-6xl ${theme.headingFont} text-white mb-6 leading-tight`}>
              {pageData.hero.headline}
            </h1>
            <div className={`w-24 h-1 mx-auto bg-white/20`} />
          </div>
        </section>

        {/* Content Blocks */}
        <section className={`py-24 px-6 mx-auto max-w-screen-xl flex flex-col gap-24`}>
          {pageData.content_blocks.map((block, idx) => {
            if (block.type === 'text') {
              return (
                <div key={idx} className="max-w-4xl mx-auto text-center">
                  <h2 className={`text-3xl md:text-4xl ${theme.headingFont} mb-8 ${theme.accentColor}`}>{block.heading}</h2>
                  <p className={`text-lg md:text-xl leading-relaxed text-neutral-300`}>{block.body}</p>
                </div>
              );
            }
            
            if (block.type === 'image_left' || block.type === 'image_right') {
              const isLeft = block.type === 'image_left';
              return (
                <div key={idx} className={`flex flex-col md:flex-row gap-12 items-center ${isLeft ? '' : 'md:flex-row-reverse'}`}>
                  {block.image && (
                    <div className="w-full md:w-1/2 aspect-square md:aspect-[4/3] relative overflow-hidden rounded-xl border border-white/10">
                      <Image src={block.image || 'https://images.unsplash.com/photo-1595428774223-ef52624120d2'} alt={block.heading} fill className="object-cover" />
                    </div>
                  )}
                  <div className={`w-full ${block.image ? 'md:w-1/2' : ''}`}>
                    <h2 className={`text-3xl md:text-4xl ${theme.headingFont} mb-6 ${theme.accentColor}`}>{block.heading}</h2>
                    <p className={`text-lg leading-relaxed text-neutral-300 whitespace-pre-wrap`}>{block.body}</p>
                  </div>
                </div>
              );
            }

            if (block.type === 'grid' && block.items) {
              return (
                <div key={idx} className="w-full">
                  <h2 className={`text-3xl md:text-4xl ${theme.headingFont} mb-12 text-center ${theme.accentColor}`}>{block.heading}</h2>
                  <p className="text-center text-neutral-300 mb-12 max-w-3xl mx-auto">{block.body}</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {block.items.map((item, i) => (
                      <div key={i} className="bg-white/5 border border-white/10 p-8 rounded-xl hover:bg-white/10 transition-colors">
                        <h3 className={`text-xl font-bold mb-4 text-white`}>{item.title}</h3>
                        <p className="text-neutral-400 leading-relaxed">{item.description}</p>
                      </div>
                    ))}
                  </div>
                </div>
              );
            }

            return null;
          })}
        </section>
      </main>
    </>
  );
}
