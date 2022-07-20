import { test } from 'uvu'
import * as assert from 'uvu/assert'
import { fromMarkdown } from 'mdast-util-from-markdown'
import { micromarkFromNoddity, mdastFromNoddity } from './index.js'

const recurseRemovePosition = obj => {
	if (obj?.children?.length) obj.children.forEach(recurseRemovePosition)
	if (obj?.position) delete obj.position
}

test('basic link parsing', () => {
	const tree = fromMarkdown('Links [[file.md|internal]] are neat', {
		extensions: [ micromarkFromNoddity() ],
		mdastExtensions: [ mdastFromNoddity() ],
	})
	recurseRemovePosition(tree)
	assert.equal(
		tree,
		{
			type: 'root',
			children: [
				{
					type: 'paragraph',
					children: [
						{
							type: 'text',
							value: 'Links ',
						},
						{
							type: 'noddityLink',
							file: 'file.md',
							text: 'internal',
						},
						{
							type: 'text',
							value: ' are neat',
						},
					],
				},
			],
		},
	)
})

test('basic link parsing without text', () => {
	const tree = fromMarkdown('Links [[file.md]] are neat', {
		extensions: [ micromarkFromNoddity() ],
		mdastExtensions: [ mdastFromNoddity() ],
	})
	recurseRemovePosition(tree)
	assert.equal(
		tree,
		{
			type: 'root',
			children: [
				{
					type: 'paragraph',
					children: [
						{
							type: 'text',
							value: 'Links ',
						},
						{
							type: 'noddityLink',
							file: 'file.md',
						},
						{
							type: 'text',
							value: ' are neat',
						},
					],
				},
			],
		},
	)
})

test('basic link parsing', () => {
	const tree = fromMarkdown('Templates ::file.md|cars|wheels=2:: are neat', {
		extensions: [ micromarkFromNoddity() ],
		mdastExtensions: [ mdastFromNoddity() ],
	})
	recurseRemovePosition(tree)
	assert.equal(
		tree,
		{
			type: 'root',
			children: [
				{
					type: 'paragraph',
					children: [
						{
							type: 'text',
							value: 'Templates ',
						},
						{
							type: 'noddityTemplate',
							file: 'file.md',
							children: [
								{
									type: 'noddityTemplateVariable',
									name: 'cars',
								},
								{
									type: 'noddityTemplateVariable',
									name: 'wheels',
									value: '2',
								},
							],
						},
						{
							type: 'text',
							value: ' are neat',
						},
					],
				},
			],
		},
	)
})

test.run()
