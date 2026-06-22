import {
  MessageCircle,
  ClipboardCheck,
  Eye,
  ShieldCheck,
  Eye as TransparencyIcon,
  Handshake,
  Headphones,
} from 'lucide-react'
import Reveal from '../components/Reveal'
import Accordion from '../components/Accordion'
import usePageMeta from '../hooks/usePageMeta'
import { pageTitle } from '../constants/brand'
import './About.css'

const workSteps = [
  {
    icon: MessageCircle,
    title: 'დაუკავშირდი მენეჯერს',
    description:
      'მომხმარებელი უკავშირდება ჩვენს მენეჯერს ან პირდაპირ გვერდის ადმინისტრაციას — ჩატით, ფორმით ან ტელეფონით. აღწერე რა გჭირდება, ჩვენ მოგისმენთ.',
  },
  {
    icon: ClipboardCheck,
    title: 'მოთხოვნის შეფასება და განაწილება',
    description:
      'მენეჯერი ყურადღებით აფასებს შენს მოთხოვნას და პასუხისმგებლობით ანაწილებს სანდო, გადამოწმებულ პარტნიორებზე — ისე, რომ სწორი სპეციალისტი მოხვდეს სწორ ამოცანაზე.',
  },
  {
    icon: Eye,
    title: 'პროცესის კონტროლი',
    description:
      'მუშაობის მთელი პროცესი კონტროლირებულია. შენ გაქვს პირდაპირი კონტაქტი მენეჯერთან ყოველ ეტაპზე — არ დარჩები უპასუხოდ და არ დარჩები ეჭვის ქვეშ.',
  },
  {
    icon: ShieldCheck,
    title: 'გარანტია და ხარისხის კონტროლი',
    description:
      'სამუშაოს დასრულების შემდეგ ვამოწმებთ შედეგს. თუ რამე არ მოგეწონა — ვიღებთ პასუხისმგებლობას და ვაგვარებთ საკითხს ერთად.',
  },
]

const team = [
  {
    name: 'გიორგი მ.',
    role: 'მენეჯერი',
    bio: 'პასუხისმგებელია კლიენტებთან კომუნიკაციაზე, პარტნიორების კოორდინაციაზე და ხარისხის კონტროლზე. ყოველთვის მზად არის დაგეხმაროს.',
    initials: 'GM',
  },
  {
    name: 'ნიკა კ.',
    role: 'დამფუძნებელი / დეველოპერი',
    bio: 'DIGIT-ის შემქმნელი. მისი მიზანია — ტექნოლოგია და ადამიანური მიდგომა ერთად, რომ ყველას ენდოთ სერვისს, რომელსაც იყენებ.',
    initials: 'NK',
  },
  {
    name: 'ანა ბ.',
    role: 'კლიენტთა მხარდაჭერა',
    bio: 'პირველი კონტაქტი ხშირად ანაა — უსმენს, პასუხობს კითხვებს და ზრუნავს, რომ პროცესი გლუვად წავიდეს დასაწყებიდან ბოლომდე.',
    initials: 'AB',
  },
]

const faqItems = [
  {
    question: 'როგორ ვირჩევთ პარტნიორებს?',
    answer:
      'ყველა პარტნიორი გადის შესაბამის შემოწმებას — გამოცდილება, რეკომენდაციები და სატესტო სამუშაო. მხოლოდ მათ, ვისაც ვენდობით, ვანდებით თქვენს მოთხოვნას. მენეჯერი ყოველთვის ირჩევს სპეციალისტს კონკრეტული ამოცანის მიხედვით, არა შემთხვევით.',
  },
  {
    question: 'რა ხდება თუ სამუშაო ხარისხიანად არ შესრულდა?',
    answer:
      'ჩვენი მიდგომა მარტივია — თუ შედეგი არ გაგიმჯობესიათ, დაუკავშირდით მენეჯერს. ერთად განვიხილავთ საკითხს და მოვძებნით გამოსავალს: გადაკეთება, კორექტირება ან სხვა გზა. თქვენი კმაყოფილება ჩვენთვის პრიორიტეტია.',
  },
  {
    question: 'რამდენი ღირს სერვისი?',
    answer:
      'ფასი დამოკიდებულია კონკრეტულ ამოცანაზე. მენეჯერი შეაფასებს მოთხოვნას და მუშაობის დაწყებამდე შეგათანხმებთ ფასს — გამჭვირვალედ, უსიამოვნო სიურპრიზების გარეშე. არაფერი არ იწყება თქვენი თანხმობის გარეშე.',
  },
  {
    question: 'რამდენ ხანში მიპასუხებენ?',
    answer:
      'სამუშაო საათებში, როგორც წესი, 1-2 საათში გიპასუხებენ. გადაუდებელი შემთხვევებისთვის მიუთითეთ ეს მოთხოვნაში — ვეცდებით მაქსიმალურად სწრაფად გიპასუხოთ.',
  },
  {
    question: 'შემიძლია უშუალოდ ვისთან ვისაუბრო?',
    answer:
      'პირველ ეტაპზე ყველა კომუნიკაცია მიდის მენეჯერის ან ადმინისტრაციის მეშვეობით — ეს გვაძლევს საშუალებას კონტროლი გვქონდეს პროცესზე და ხარისხზე. სამუშაოს დაწყების შემდეგ, საჭირების შემთხვევაში, შესაძლებელია პირდაპირი კონტაქტი სპეციალისტთან, მენეჯერის ხელმძღვანელობით.',
  },
]

const trustBadges = [
  {
    icon: TransparencyIcon,
    title: '100% გამჭვირვალობა',
    text: 'იცი რას, რატომ და რამდენად — ყველა ნაბიჯი ნათელია.',
  },
  {
    icon: Handshake,
    title: 'ფასის შეთანხმება წინასწარ',
    text: 'მუშაობა იწყება მხოლოდ მაშინ, როცა ფასს და პირობებს ეთანხმები.',
  },
  {
    icon: Headphones,
    title: 'პირდაპირი კონტაქტი მენეჯერთან',
    text: 'ერთი სანდო ადამიანი გიპასუხება — არა უცნობი ნომერი ან უპასუხო ჩატი.',
  },
]

function About() {
  usePageMeta(
    pageTitle('ჩვენ შესახებ'),
    'DIGIT — ჩვენი ისტორია, გუნდი და გარანტიები. სანდო გზა სპეციალისტებთან ერთი მენეჯერის კონტროლით.'
  )

  return (
    <div className="about">
      <section className="about-mission">
        <div className="container">
          <Reveal className="about-mission__inner">
            <span className="about-mission__label">ჩვენი ისტორია</span>
            <h1 className="about-mission__title">ნდობა, რომელიც გამოიმსახურებს</h1>
            <div className="about-mission__text">
              <p>
                ბევრმა ადამიანმა გამოიცადა — დაუკავშირდი სპეციალისტს, გადაიხადე,
                მიიღე ცუდი შედეგი და ვეღარ ვისაც ენდო. ჩვენ ზუსტად ამ პრობლემის
                გამო შევქმენით DIGIT.
              </p>
              <p>
                ჩვენი მიზანი მარტივია: DIGIT-ით მოგცეთ სანდო, კონტროლირებადი გზა
                სპეციალისტებთან — ერთი მენეჯერის მეშვეობით, რომელიც პასუხისმგებელია
                ხარისხზე, კომუნიკაციაზე და შედეგზე. არ ვატყუებთ, არ ვამალავთ —
                ვთავაზობთ გამჭვირვალობას და პასუხისმგებლობას.
              </p>
            </div>
          </Reveal>
        </div>
      </section>

      <section className="about-section about-work">
        <div className="container">
          <Reveal className="about-section__header">
            <h2 className="about-section__title">როგორ ვმუშაობთ</h2>
            <p className="about-section__subtitle">
              ყველა ნაბიჯი გამჭვირვალია — შენ ყოველთვის იცი რა ხდება
            </p>
          </Reveal>

          <div className="about-work__steps">
            {workSteps.map(({ icon: Icon, title, description }, index) => (
              <Reveal key={title} className="about-work__step" delay={index * 100}>
                <div className="about-work__step-num">{index + 1}</div>
                <div className="about-work__step-icon">
                  <Icon size={24} strokeWidth={1.75} />
                </div>
                <h3 className="about-work__step-title">{title}</h3>
                <p className="about-work__step-text">{description}</p>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="about-section about-team">
        <div className="container">
          <Reveal className="about-section__header">
            <h2 className="about-section__title">ჩვენი გუნდი</h2>
            <p className="about-section__subtitle">
              ადამიანები, რომლებიც ზრუნავენ შენს გამოცდილებაზე
            </p>
          </Reveal>

          <div className="about-team__grid">
            {team.map(({ name, role, bio, initials }, index) => (
              <Reveal key={name} className="team-card" delay={index * 100}>
                <div className="team-card__avatar" aria-hidden="true">
                  {initials}
                </div>
                <h3 className="team-card__name">{name}</h3>
                <p className="team-card__role">{role}</p>
                <p className="team-card__bio">{bio}</p>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="about-section about-faq">
        <div className="container">
          <Reveal className="about-section__header">
            <h2 className="about-section__title">ხშირად დასმული კითხვები</h2>
            <p className="about-section__subtitle">
              პასუხები, რომლებიც შესაძლობს დაგეხმაროთ გადაწყვეტილების მიღებაში
            </p>
          </Reveal>

          <Reveal delay={100}>
            <Accordion items={faqItems} />
          </Reveal>
        </div>
      </section>

      <section className="about-section about-trust">
        <div className="container">
          <Reveal className="about-section__header">
            <h2 className="about-section__title">ჩვენი გარანტიები</h2>
            <p className="about-section__subtitle">
              პრინციპები, რომლებზეც აგებულია DIGIT
            </p>
          </Reveal>

          <div className="about-trust__grid">
            {trustBadges.map(({ icon: Icon, title, text }, index) => (
              <Reveal key={title} className="trust-badge" delay={index * 80}>
                <div className="trust-badge__icon">
                  <Icon size={26} strokeWidth={1.75} />
                </div>
                <h3 className="trust-badge__title">{title}</h3>
                <p className="trust-badge__text">{text}</p>
              </Reveal>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}

export default About
