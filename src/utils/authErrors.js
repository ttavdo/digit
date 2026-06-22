const AUTH_ERROR_MESSAGES = {
  'auth/email-already-in-use': 'ეს ემაილი უკვე დარეგისტრირებულია.',
  'auth/invalid-email': 'ელ. ფოსტის ფორმატი არასწორია.',
  'auth/operation-not-allowed': 'ეს ავტორიზაციის მეთოდი არ არის ჩართული.',
  'auth/configuration-not-found':
    'Firebase Authentication არ არის ჩართული. Console → Authentication → Get started, შემდეგ ჩართე Email/Password.',
  'auth/weak-password': 'პაროლი ძალიან სუსტია. გამოიყენეთ მინიმუმ 6 სიმბოლო.',
  'auth/user-disabled': 'ეს ანგარიში გათიშულია.',
  'auth/user-not-found': 'მომხმარებელი ამ ემაილით ვერ მოიძებნა.',
  'auth/wrong-password': 'არასწორი პაროლი.',
  'auth/invalid-credential': 'ელ. ფოსტა ან პაროლი არასწორია.',
  'auth/too-many-requests': 'ძალიან ბევრი მცდელობა. სცადეთ მოგვიანებით.',
  'auth/popup-closed-by-user': 'Google-ით შესვლა გაუქმდა.',
  'auth/cancelled-popup-request': 'ავტორიზაცია გაუქმდა.',
  'auth/network-request-failed': 'ქსელის შეცდომა. შეამოწმეთ ინტერნეტი.',
  'auth/missing-password': 'გთხოვთ, შეიყვანოთ პაროლი.',
}

export function getAuthErrorMessage(error) {
  const code = error?.code
  if (code && AUTH_ERROR_MESSAGES[code]) {
    return AUTH_ERROR_MESSAGES[code]
  }
  return error?.message || 'დაფიქსირდა შეცდომა. სცადეთ თავიდან.'
}

export function validateEmail(email) {
  if (!email.trim()) return 'ელ. ფოსტა სავალდებულოა.'
  const pattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!pattern.test(email)) return 'ელ. ფოსტის ფორმატი არასწორია.'
  return null
}

export function validatePassword(password) {
  if (!password) return 'პაროლი სავალდებულოა.'
  if (password.length < 6) return 'პაროლი უნდა შეიცავდეს მინიმუმ 6 სიმბოლოს.'
  return null
}

export function validateName(name) {
  if (!name.trim()) return 'სახელი სავალდებულოა.'
  if (name.trim().length < 2) return 'სახელი ძალიან მოკლეა.'
  if (name.trim().length > 80) return 'სახელი ძალიან გრძელია (მაქს. 80 სიმბოლო).'
  return null
}

export function validatePasswordMatch(password, confirmPassword) {
  if (!confirmPassword) return 'გთხოვთ, დაადასტუროთ პაროლი.'
  if (password !== confirmPassword) return 'პაროლები არ ემთხვევა.'
  return null
}
