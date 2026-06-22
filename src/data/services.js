import {
  Monitor,
  Globe,
  MessageSquare,
  Building2,
  Smartphone,
  HelpCircle,
} from 'lucide-react'

export const allServices = [
  {
    id: 'computer-repair',
    icon: Monitor,
    title: 'კომპიუტერის/ტექნიკის შეკეთება',
    description:
      'ლეპტოპების, დესკტოპ კომპიუტერების და სხვა ტექნიკის დიაგნოსტიკა, შეკეთება და აღდგენა. ჰარდვერული და პროგრამული პრობლემების სწრაფი გადაჭრა.',
  },
  {
    id: 'website',
    icon: Globe,
    title: 'ვებსაიტის დამზადება',
    description:
      'კორპორატიული, portfolio და e-commerce ვებსაიტების შექმნა. თანამედროვე დიზაინი, მობილური ადაპტაცია და SEO-ს ოპტიმიზაცია.',
  },
  {
    id: 'technical-consultation',
    icon: MessageSquare,
    title: '\u10e2\u10d4\u10e5\u10dc\u10d8\u10d9\u10e3\u10e0\u10d8 \u10d9\u10dd\u10dc\u10e1\u10e3\u10da\u10a2\u10d0\u10ea\u10d8\u10d0',
    description:
      'ტექნოლოგიური გადაწყვეტილებების შერჩევაში დახმარება. არქიტექტურის შეფასება, რჩევები აღჭურვილობისა და პროგრამული უზრუნველყოფის ასარჩევად.',
  },
  {
    id: 'it-support-business',
    icon: Building2,
    title: 'IT მხარდაჭერა ბიზნესისთვის',
    description:
      'ოფისის IT ინფრასტრუქტურის მოვლა, სერვერების მართვა და მუდმივი ტექნიკური მხარდაჭერა. შეთანხმებით პაკეტები მცირე და საშუალო ბიზნესისთვის.',
  },
  {
    id: 'gadget-repair',
    icon: Smartphone,
    title: 'სმარტფონის/გაჯეტის შეკეთება',
    description:
      'ტელეფონების, ტაბლეტების და სხვა გაჯეტების ეკრანის, ბატარეის და სხვა კომპონენტების შეკეთება. მონაცემების შენახვის შესაძლებლობით.',
  },
  {
    id: 'custom',
    icon: HelpCircle,
    title: 'სხვა',
    description:
      'არ ნახე რასაც ეძებდი? დაგვიკავშირდე და ვიპოვით შესაბამის სპეციალისტს შენი ამოცანისთვის.',
    custom: true,
  },
]

export const popularServices = allServices.filter((s) => !s.custom)

export function getServiceById(id) {
  return allServices.find((s) => s.id === id) ?? null
}
