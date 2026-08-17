import { OfficeParser } from 'officeparser'

const supportedExtensions = new Set(['pdf', 'docx', 'doc', 'rtf', 'txt'])

export function getExtension(fileName: string) {
  return fileName.toLowerCase().split('.').pop() ?? ''
}

export function isSupportedCv(fileName: string, contentType: string) {
  const extension = getExtension(fileName)
  return supportedExtensions.has(extension) && (contentType === 'text/plain' || contentType === 'application/pdf' || contentType === 'application/rtf' || contentType === 'text/rtf' || contentType.includes('wordprocessingml') || contentType === 'application/msword')
}

export async function extractCvText(buffer: Buffer, fileName: string) {
  const extension = getExtension(fileName)
  if (extension === 'txt') return buffer.toString('utf8').slice(0, 120_000)
  const ast = extension === 'doc' ? await OfficeParser.parseOffice(buffer) : await OfficeParser.parseOffice(buffer, { fileType: extension as 'pdf' | 'docx' | 'rtf' })
  return ast.toText().slice(0, 120_000)
}
