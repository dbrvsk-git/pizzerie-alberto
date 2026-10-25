import Image from "next/image";
import FadeIn from "@/components/FadeIn";
import Gallery from "@/components/Gallery";
import MenuSection from "@/components/MenuSection";
import ReservationWizard from "@/components/ReservationWizard";
import SiteHeader from "@/components/SiteHeader";
import { getMenu } from "@/lib/menu";

// jídelní lístek se mění v administraci, proto se stránka generuje při každém požadavku
export const dynamic = "force-dynamic";

const PHONE = "+420 777 852 963";
const HOURS = "Po–Ne: 11:00–23:00";

function Divider({ className = "my-4" }: { className?: string }) {
  return <div className={`mx-auto h-0.5 w-24 rounded-full bg-cihla ${className}`} />;
}

function SectionTitle({ children, bg }: { children: React.ReactNode; bg: string }) {
  return (
    <>
      <h2 className={`mx-auto w-fit rounded-xl p-2 text-5xl ${bg}`}>{children}</h2>
      <Divider />
    </>
  );
}

const CONTACTS = [
  {
    text: "Zíkova 86, Praha 2",
    icon: (
      <>
        <path d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0" />
        <circle cx="12" cy="10" r="3" />
      </>
    ),
  },
  {
    text: PHONE,
    href: `tel:${PHONE.replace(/\s/g, "")}`,
    icon: (
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
    ),
  },
  {
    text: HOURS,
    icon: (
      <>
        <circle cx="12" cy="12" r="10" />
        <polyline points="12 6 12 12 16 14" />
      </>
    ),
  },
];

export default async function Home() {
  const menu = await getMenu();

  return (
    <>
      <SiteHeader />
      <FadeIn />

      <main id="top">
        {/* hero */}
        <section className="relative isolate flex min-h-screen flex-col items-center justify-center overflow-hidden px-4">
          <div className="hero-zoom absolute inset-0 -z-10">
            <Image src="/img/hero-pizza.jpg" alt="" fill priority sizes="100vw" className="object-cover" />
            <div className="absolute inset-0 bg-black/50" />
          </div>

          <div className="tag fadein text-center text-3xl text-white">
            <p>{PHONE}</p>
            <Divider className="my-10" />
            <p>{HOURS}</p>
          </div>

          <h1 className="tracking-in-expand-fwd mb-4 mt-12 text-center text-6xl font-bold text-white md:text-8xl md:font-thin">
            Pizzerie Alberto
          </h1>
          <p className="tag from-bottom text-center text-2xl text-white">Itálie s láskou… už od roku&nbsp;2005</p>

          <Divider className="my-10" />

          <div className="flex flex-row gap-8">
            <a
              href="#menu"
              className="tag from-top rounded-lg border border-cihla bg-cihla px-4 py-2.5 text-lg text-white transition duration-300 hover:scale-105 hover:border-white hover:bg-transparent"
            >
              Jídelní lístek
            </a>
            <a
              href="#rezervace"
              className="tag from-top rounded-lg border border-white px-4 py-2.5 text-lg text-white transition duration-300 hover:scale-105 hover:bg-white hover:text-gray-800"
            >
              Rezervace
            </a>
          </div>

          <a
            href="#menu"
            aria-label="Posunout dolů"
            className="absolute bottom-10 left-1/2 hidden size-10 -translate-x-1/2 animate-bounce rounded-full bg-white p-2 sm:flex"
          >
            <Image src="/img/arr-down.gif" alt="" width={24} height={24} unoptimized />
          </a>
        </section>

        {/* jídelní lístek */}
        <section
          id="menu"
          className="scroll-mt-16 bg-back1 bg-[url(/img/back-pizza.jpg)] bg-cover bg-top bg-no-repeat py-20"
        >
          <SectionTitle bg="bg-back1">Jídelní lístek</SectionTitle>
          <div className="container mx-auto mt-12 px-4">
            <MenuSection categories={menu} />
          </div>
        </section>

        {/* rezervace */}
        <section id="rezervace" className="scroll-mt-16 bg-back2 py-20">
          <div className="mx-auto max-w-5xl px-4">
            <div className="mb-12 text-center">
              <SectionTitle bg="bg-back2">Rezervace stolu</SectionTitle>
              <p className="mt-8 text-gray-600">Rezervujte si místo včas</p>
            </div>

            <div className="grid grid-cols-1 items-center md:grid-cols-2">
              <div className="z-10 rounded-xl bg-back3 p-6 shadow-xl sm:p-8">
                <ReservationWizard />
              </div>
              <div className="-mt-80 animate-[spin_180s_linear_infinite] md:-ms-10 md:mt-0 motion-reduce:animate-none">
                <Image src="/img/pizza-transp.png" alt="" width={752} height={686} />
              </div>
            </div>
          </div>
        </section>

        {/* galerie */}
        <section
          id="galerie"
          className="scroll-mt-16 bg-back1 bg-[url(/img/back4-pizza.jpg)] bg-size-[30%] bg-right-top bg-no-repeat py-20"
        >
          <div className="mx-auto max-w-5xl px-4">
            <div className="mb-7 text-center">
              <SectionTitle bg="bg-back1">Galerie</SectionTitle>
              <p className="mx-auto mt-8 w-fit rounded-xl bg-back1 p-2">
                Přivítá Vás útulný interiér v přírodním stylu, který voní dřevem a cihlou. V létě se restaurace
                otevírá ven – na prostornou zahrádku obklopenou zelení, kde se zpomalí čas a jídlo chutná ještě lépe.
                A zatímco vy si vychutnáváte oběd či večeři, děti se mohou zabavit na menším hřišti vedle zahrádky.
              </p>
            </div>
            <Gallery />
          </div>
        </section>

        {/* kontakt */}
        <section
          id="kontakt"
          className="scroll-mt-16 bg-back2 bg-[url(/img/pattern.png)] bg-size-[60%] bg-center bg-no-repeat py-20"
        >
          <div className="mx-auto max-w-4xl px-4">
            <div className="mx-auto mb-12 w-fit rounded-xl bg-back2 p-2 text-center">
              <h2 className="text-5xl">Kontakt</h2>
              <Divider />
              <p className="mt-8 text-gray-600">Napište nám, zavolejte, stavte se</p>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              {CONTACTS.map((contact) => (
                <div key={contact.text} className="rounded-xl border border-line bg-back3 p-5 text-center shadow-xl">
                  <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-cihla/10">
                    <svg
                      width="24"
                      height="24"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="#c34b22"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      {contact.icon}
                    </svg>
                  </div>
                  <p className="mt-8 text-xl">
                    {contact.href ? <a href={contact.href}>{contact.text}</a> : contact.text}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      <footer className="bg-black p-10 text-center text-white">
        <h2 className="mb-2 text-4xl">Pizzerie Alberto</h2>
        <p className="font-thin">děláme pro Vás italskou gastronomii už od roku 2005</p>
        <Divider className="mb-8 mt-10" />
        <ul className="mt-10 flex flex-col justify-center gap-10 font-medium sm:flex-row">
          <li>
            <a href="#top">Domů</a>
          </li>
          <li>
            <a href="#menu">Menu</a>
          </li>
          <li>
            <a href="#rezervace">Rezervace</a>
          </li>
          <li>
            <a href="#galerie">Galerie</a>
          </li>
          <li>
            <a href="#kontakt">Kontakt</a>
          </li>
        </ul>
      </footer>
    </>
  );
}
