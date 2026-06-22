export const MAX_MESSAGE_LENGTH = 2000
export const MAX_ORDER_DESCRIPTION_LENGTH = 5000
export const MAX_NOTE_LENGTH = 2000
export const MAX_NAME_LENGTH = 80

export function truncateText(text, maxLength) {
  if (text.length <= maxLength) return text
  return text.slice(0, maxLength)
}

export function validateMessageLength(text, maxLength = MAX_MESSAGE_LENGTH) {
  if (text.length > maxLength) {
    return `ტექსტი უნდა იყოს მაქსიმუმ ${maxLength} სიმბოლო.`
  }
  return null
}
