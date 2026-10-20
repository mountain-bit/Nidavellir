/**
 * Mathematical formula evaluator and stat value parser.
 * Implements safe arithmetic evaluation via Shunting-yard algorithm and RPN evaluator.
 * Supports dice notation ("2d6", "d20+2"), Polish variable identifiers, and basic math operators.
 */

import { t } from '../../../../dist/Utils/translate.js'

/**
 * Safely parses a stat value string into a numerical value.
 * Supports numbers ("15", "12.5"), dice notation ("d6", "2d6", "1d20+2"), or extracts leading digits.
 *
 * @param {any} val
 * @returns {number|null}
 */
export function parseStatValueAsNumber(val) {
    if (val === undefined || val === null) return null
    const str = String(val).trim()
    if (!str) return null

    // Pure number
    if (/^-?\d+(\.\d+)?$/.test(str)) {
        return parseFloat(str)
    }

    // Dice notation: e.g. "d6", "2d6", "1d20+5", "3d8-2"
    const diceMatch = str.match(/^(\d+)?d(\d+)([+-]\d+)?$/i)
    if (diceMatch) {
        const count = diceMatch[1] ? parseInt(diceMatch[1], 10) : 1
        const sides = parseInt(diceMatch[2], 10)
        const bonus = diceMatch[3] ? parseInt(diceMatch[3], 10) : 0
        const avgPerDie = (sides + 1) / 2
        return count * avgPerDie + bonus
    }

    // Leading number
    const leadMatch = str.match(/^-?\d+(\.\d+)?/)
    if (leadMatch) {
        return parseFloat(leadMatch[0])
    }

    return null
}

/**
 * Safely tokenizes and evaluates an arithmetic expression with stat variables.
 * Uses the Shunting-yard algorithm and RPN evaluator (safe arithmetic only, zero eval).
 *
 * @param {string} formula e.g. "Siła * 4 + 10", "(Kondycja + 5) * 2"
 * @param {Record<string, any>} [statsMap={}] Map of stat names to values
 * @returns {{ result: number|null, error?: string }}
 */
export function evaluateFormula(formula, statsMap = {}) {
    if (!formula || typeof formula !== 'string' || !formula.trim()) {
        return { result: null }
    }

    // Normalize statsMap keys to lowercase trimmed
    const normalizedStats = {}
    if (statsMap && typeof statsMap === 'object') {
        Object.entries(statsMap).forEach(([k, v]) => {
            const key = k.trim().toLowerCase()
            const numVal = typeof v === 'number' ? v : parseStatValueAsNumber(v)
            if (numVal !== null && !isNaN(numVal)) {
                normalizedStats[key] = numVal
            }
        })
    }

    const str = formula.trim()
    const tokens = []
    let i = 0

    function canBeUnary() {
        if (tokens.length === 0) return true
        const last = tokens[tokens.length - 1]
        return last.type === 'OP' || last.type === 'LPAREN'
    }

    while (i < str.length) {
        const char = str[i]

        // Whitespace
        if (/\s/.test(char)) {
            i++
            continue
        }

        // Numbers (integers or decimals)
        if (/\d/.test(char) || (char === '.' && i + 1 < str.length && /\d/.test(str[i + 1]))) {
            let numStr = ''
            while (i < str.length && /[\d.]/.test(str[i])) {
                numStr += str[i]
                i++
            }
            const parsed = parseFloat(numStr)
            if (isNaN(parsed)) {
                return { result: null, error: t('formula.invalid_number', { num: numStr }) }
            }
            tokens.push({ type: 'NUM', value: parsed })
            continue
        }

        // Parentheses
        if (char === '(') {
            tokens.push({ type: 'LPAREN' })
            i++
            continue
        }
        if (char === ')') {
            tokens.push({ type: 'RPAREN' })
            i++
            continue
        }

        // Unary operators: - or +
        if ((char === '-' || char === '+') && canBeUnary()) {
            if (char === '-') {
                tokens.push({
                    type: 'OP',
                    value: 'u-',
                    precedence: 4,
                    rightAssoc: true,
                    isUnary: true,
                })
            }
            i++
            continue
        }

        // Binary operators: +, -, *, /, %
        if ('+-*/%'.includes(char)) {
            const precedence = char === '*' || char === '/' || char === '%' ? 3 : 2
            tokens.push({ type: 'OP', value: char, precedence, rightAssoc: false })
            i++
            continue
        }

        // Variable identifiers (support unicode for Polish characters)
        if (/[\p{L}_]/u.test(char)) {
            let ident = ''
            while (i < str.length && /[\p{L}\p{N}_]/u.test(str[i])) {
                ident += str[i]
                i++
            }
            const identLower = ident.toLowerCase()
            if (identLower in normalizedStats) {
                tokens.push({ type: 'NUM', value: normalizedStats[identLower] })
            } else {
                return { result: null, error: t('formula.missing_stat', { name: ident }) }
            }
            continue
        }

        // Disallowed character
        return { result: null, error: t('formula.invalid_char', { char }) }
    }

    if (tokens.length === 0) return { result: null }

    // Shunting-yard to RPN
    const outputQueue = []
    const opStack = []

    for (const token of tokens) {
        if (token.type === 'NUM') {
            outputQueue.push(token)
        } else if (token.type === 'OP') {
            while (opStack.length > 0) {
                const top = opStack[opStack.length - 1]
                if (top.type === 'OP') {
                    if (
                        (!token.rightAssoc && token.precedence <= top.precedence) ||
                        (token.rightAssoc && token.precedence < top.precedence)
                    ) {
                        outputQueue.push(opStack.pop())
                        continue
                    }
                }
                break
            }
            opStack.push(token)
        } else if (token.type === 'LPAREN') {
            opStack.push(token)
        } else if (token.type === 'RPAREN') {
            let foundLparen = false
            while (opStack.length > 0) {
                const top = opStack.pop()
                if (top.type === 'LPAREN') {
                    foundLparen = true
                    break
                }
                outputQueue.push(top)
            }
            if (!foundLparen) {
                return { result: null, error: t('formula.unbalanced_parens') }
            }
        }
    }

    while (opStack.length > 0) {
        const top = opStack.pop()
        if (top.type === 'LPAREN' || top.type === 'RPAREN') {
            return { result: null, error: t('formula.unbalanced_parens') }
        }
        outputQueue.push(top)
    }

    // Evaluate RPN
    const evalStack = []
    for (const token of outputQueue) {
        if (token.type === 'NUM') {
            evalStack.push(token.value)
        } else if (token.type === 'OP') {
            if (token.isUnary) {
                if (evalStack.length < 1) return { result: null, error: t('formula.syntax_error') }
                const a = evalStack.pop()
                evalStack.push(-a)
            } else {
                if (evalStack.length < 2) return { result: null, error: t('formula.syntax_error') }
                const b = evalStack.pop()
                const a = evalStack.pop()
                let res = 0
                switch (token.value) {
                    case '+':
                        res = a + b
                        break
                    case '-':
                        res = a - b
                        break
                    case '*':
                        res = a * b
                        break
                    case '/':
                        if (b === 0) return { result: null, error: t('formula.div_zero') }
                        res = a / b
                        break
                    case '%':
                        if (b === 0) return { result: null, error: t('formula.div_zero') }
                        res = a % b
                        break
                    default:
                        return { result: null, error: t('formula.unknown_op') }
                }
                evalStack.push(res)
            }
        }
    }

    if (evalStack.length !== 1) {
        return { result: null, error: t('formula.syntax_error') }
    }

    const finalVal = evalStack[0]
    const rounded = Math.round(finalVal * 100) / 100
    return { result: rounded }
}
