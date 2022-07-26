import { markdownLineEnding } from 'micromark-util-character'

import { types } from 'micromark-util-symbol/types.js'
// import { codes } from 'micromark-util-symbol/codes.js'
// console.log(codes)

export { noddityMdastMutator } from './mutator.js'

const CHARS = {
	CR: -5,
	LF: -4,
	CRLF: -3,
	SQUARE_BRACE_LEFT: 91,
	SQUARE_BRACE_RIGHT: 93,
	PIPE: 124,
	COLON: 58,
}

const LINK_FENCE_CHAR_LENGTH = 2

export const micromarkFromNoddity = () => {

	function tokenizeClosingLinkFence(effects, ok, nok) {
		let sizeClose = 0
		let self = this
		return closeFence
		function closeFence(code) {
			if (code === CHARS.SQUARE_BRACE_RIGHT && !sizeClose) {
				const previousType = self.events[self.events.length - 1][1].type
				if (previousType !== 'noddityLinkDelimiter') effects.exit(
					// could be closing a link, or could be closing the text
					previousType,
				)
				effects.enter('noddityLinkFence')
				effects.consume(code)
				sizeClose++
				return closeFence
			} else if (code === CHARS.SQUARE_BRACE_RIGHT) {
				sizeClose++
				effects.consume(code)
				if (sizeClose === LINK_FENCE_CHAR_LENGTH) {
					effects.exit('noddityLinkFence')
					return ok(code)
				} else {
					return nok(code)
				}
			}
			return nok(code)
		}
	}

	function noddityLinkTokenize(effects, ok, nok) {
		let sizeOpen = 0
		let marker
		let hasBeenPiped
		let self = this

		return start

		function start(code) {
			effects.enter('noddityLink')
			effects.enter('noddityLinkFence')
			marker = code
			return linkSequenceOpen(code)
		}

		function linkSequenceOpen(code) {
			if (code === marker) {
				effects.consume(code)
				sizeOpen++
				return linkSequenceOpen
			}
			if (sizeOpen < LINK_FENCE_CHAR_LENGTH) {
				return nok(code)
			} else {
				effects.exit('noddityLinkFence')
				effects.enter('noddityLinkUrl')
				effects.consume(code)
				return linkUrlOpen
			}
		}

		function wasCorrectFence(code) {
			effects.exit('noddityLink')
			return ok(code)
		}

		function wasColonInText(code) {
			effects.consume(code)
			return linkUrlOpen
		}

		function linkUrlOpen(code) {
			const previousType = self.events[self.events.length - 1]?.[1]?.type
			if (markdownLineEnding(code) || code === null) { // newlines not allowed in links
				return nok(code)
			} else if (code !== CHARS.SQUARE_BRACE_RIGHT && previousType === 'noddityLinkDelimiter') {
				effects.enter('noddityLinkText', { contentType: types.content })
				effects.consume(code)
				return linkUrlOpen
			} else if (code === CHARS.PIPE && !hasBeenPiped) {
				hasBeenPiped = true
				effects.exit('noddityLinkUrl')
				effects.enter('noddityLinkDelimiter')
				effects.consume(code)
				effects.exit('noddityLinkDelimiter')
				return linkUrlOpen
			} else if (code === CHARS.SQUARE_BRACE_RIGHT) {
				return effects.attempt(
					{ tokenize: tokenizeClosingLinkFence, partial: true },
					wasCorrectFence,
					wasColonInText,
				)
			} else {
				effects.consume(code)
				return linkUrlOpen
			}
		}
	}

	function tokenizeClosingTemplateFence(effects, ok, nok) {
		let sizeClose = 0
		return closeFence
		function closeFence(code) {
			if (code === CHARS.COLON && !sizeClose) {
				effects.exit('noddityTemplateText')
				effects.enter('noddityTemplateFence')
				effects.consume(code)
				sizeClose++
				return closeFence
			} else if (code === CHARS.COLON) {
				sizeClose++
				effects.consume(code)
				if (sizeClose === LINK_FENCE_CHAR_LENGTH) {
					effects.exit('noddityTemplateFence')
					return ok(code)
				} else {
					return nok(code)
				}
			}
			return nok(code)
		}
	}

	function noddityTemplateTokenize(effects, ok, nok) {
		let sizeOpen = 0
		let marker

		return start

		function start(code) {
			effects.enter('noddityTemplate')
			effects.enter('noddityTemplateFence')
			marker = code
			return templateSequenceOpen(code)
		}

		function templateSequenceOpen(code) {
			if (code === marker) {
				effects.consume(code)
				sizeOpen++
				return templateSequenceOpen
			}
			if (sizeOpen !== LINK_FENCE_CHAR_LENGTH) {
				return nok(code)
			} else {
				effects.exit('noddityTemplateFence')
				effects.enter('noddityTemplateText')
				effects.consume(code)
				return templateOpen
			}
		}

		function templateOpen(code) {
			if (markdownLineEnding(code) || code === null) { // newlines not allowed in templates
				return nok(code)
			} else if (code === CHARS.COLON) {
				return effects.attempt(
					{ tokenize: tokenizeClosingTemplateFence, partial: true },
					function wasCorrectFence(code) {
						effects.exit('noddityTemplate')
						return ok(code)
					},
					function wasColonInText(code) {
						effects.consume(code)
						return templateOpen
					},
				)
			} else {
				effects.consume(code)
				return templateOpen
			}
		}
	}

	return {
		text: {
			[CHARS.SQUARE_BRACE_LEFT]: {
				name: 'noddityLink',
				tokenize: noddityLinkTokenize,
			},
			[CHARS.COLON]: {
				name: 'noddityTemplate',
				tokenize: noddityTemplateTokenize,
			},
		},
	}
}

export const mdastFromNoddity = () => {
	return {
		enter: {
			noddityLink: enterNoddityLink,
			noddityLinkUrl: enterNoddityLinkUrl,
			noddityTemplateText: enterNoddityTemplateText,
		},
		exit: {
			noddityLink: exitNoddityLink,
			noddityLinkUrl: exitNoddityLinkUrl,
			noddityTemplateText: exitNoddityTemplateText,
		},
	}
	function enterNoddityLink(token) {
		this.enter({ type: 'noddityLink', children: [] }, token)
	}
	function exitNoddityLink(token) {
		const node = this.exit(token)
		if (node.children[0]?.type === 'noddityLinkUrl') {
			const urlNode = node.children.shift()
			node.file = urlNode.file
		}
		if (node.children.length === 1 && node.children[0].type === 'paragraph' && node.children[0].children) {
			node.children = node.children[0].children
		}
		if (!node.children.length) delete node.children
	}
	function enterNoddityLinkUrl(token) {
		this.enter({ type: 'noddityLinkUrl', file: this.sliceSerialize(token) }, token)
	}
	function exitNoddityLinkUrl(token) {
		this.exit(token)
	}
	function enterNoddityTemplateText(token) {
		this.enter({ type: 'noddityTemplate', children: [] }, token)
	}
	function exitNoddityTemplateText(token) {
		const node = this.exit(token)
		const [ fileString, ...variables ] = this.sliceSerialize(token).split('|')
		node.file = fileString
		for (const variableString of variables) {
			const variable = { type: 'noddityTemplateVariable' }
			const firstEqualIndex = variableString.indexOf('=')
			if (firstEqualIndex > 0) {
				variable.name = variableString.slice(0, firstEqualIndex)
				variable.value = variableString.slice(firstEqualIndex + 1)
			} else {
				variable.name = variableString
			}
			node.children.push(variable)
		}
	}
}
