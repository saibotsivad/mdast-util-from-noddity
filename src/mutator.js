export const noddityMdastMutator = ({ urlRenderer, templateResolver }) => {
	const climbTree = async (node, filename) => {
		if (node?.type === 'noddityLink') {
			node.type = 'link'
			node.title = null
			node.url = await urlRenderer({ filename, link: node.file })
			node.children = node.children || [ { type: 'text', value: node.text || node.file } ]
			delete node.text
			delete node.file
			return node
		} else if (node?.type === 'noddityTemplate') {
			const variables = []
			for (const { name, value } of node.children) {
				const single = { name, positional: value === undefined }
				if (value !== undefined) single.value = value
				variables.push(single)
			}
			return templateResolver({ filename, template: node.file, variables })
		} else if (node?.children?.length) {
			let index = 0
			for (const child of node.children) {
				const out = await climbTree(child, filename)
				if (out) node.children[index] = out
				index++
			}
		}
	}
	return climbTree
}
