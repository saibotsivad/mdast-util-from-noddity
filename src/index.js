import { markdownLineEnding } from 'micromark-util-character'

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
	function noddityLinkTokenize(effects, ok, nok) {
		let sizeOpen = 0
		let sizeClose = 0
		let marker

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
				effects.enter('noddityLinkText')
				effects.consume(code)
				return linkOpen
			}
		}

		function linkOpen(code) {
			if (markdownLineEnding(code)) { // newlines not allowed in links
				return nok(code)
			} else if (code === CHARS.SQUARE_BRACE_RIGHT) { // TODO right square brace not allowed in filename?
				effects.exit('noddityLinkText')
				effects.enter('noddityLinkFence')
				marker = code
				return linkClose(code)
			} else {
				effects.consume(code)
				return linkOpen
			}
		}

		function linkClose(code) {
			if (code === marker) {
				effects.consume(code)
				sizeClose++
				return linkClose
			}

			effects.exit('noddityLinkFence')
			if (sizeClose < LINK_FENCE_CHAR_LENGTH) {
				return nok(code)
			} else {
				effects.exit('noddityLink')
				return ok(code)
			}
		}
	}
	function noddityTemplateTokenize(effects, ok, nok) {
		let sizeOpen = 0
		let sizeClose = 0
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
			if (sizeOpen < LINK_FENCE_CHAR_LENGTH) {
				return nok(code)
			} else {
				effects.exit('noddityTemplateFence')
				effects.enter('noddityTemplateText')
				effects.consume(code)
				return templateOpen
			}
		}

		function templateOpen(code) {
			if (markdownLineEnding(code)) { // newlines not allowed in templates
				return nok(code)
			} else if (code === CHARS.COLON) { // TODO colon not allowed in filename?
				effects.exit('noddityTemplateText')
				effects.enter('noddityTemplateFence')
				marker = code
				return templateClose(code)
			} else {
				effects.consume(code)
				return templateOpen
			}
		}

		function templateClose(code) {
			if (code === marker) {
				effects.consume(code)
				sizeClose++
				return templateClose
			}

			effects.exit('noddityTemplateFence')
			if (sizeClose < LINK_FENCE_CHAR_LENGTH) {
				return nok(code)
			} else {
				effects.exit('noddityTemplate')
				return ok(code)
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
			noddityLinkText: enterNoddityLinkUrl,
			noddityTemplateText: enterNoddityTemplateText,
		},
		exit: {
			noddityLinkText: exitNoddityLinkUrl,
			noddityTemplateText: exitNoddityTemplateText,
		},
	}
	function enterNoddityLinkUrl(token) {
		this.enter({ type: 'noddityLink' }, token)
	}
	function exitNoddityLinkUrl(token) {
		const node = this.exit(token)
		let fileString = this.sliceSerialize(token)
		const firstPipeIndex = fileString.indexOf('|')
		let textString
		if (firstPipeIndex > 0) {
			textString = fileString.slice(firstPipeIndex + 1)
			fileString = fileString.slice(0, firstPipeIndex)
		}
		node.file = fileString
		if (textString) node.text = textString
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
