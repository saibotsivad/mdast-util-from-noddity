import { test } from 'uvu'
import * as assert from 'uvu/assert'
import { fromMarkdown } from 'mdast-util-from-markdown'
import { micromarkFromNoddity, mdastFromNoddity } from './index.js'
import { noddityMdastMutator } from './index.js'

const recurseRemovePosition = obj => {
	if (obj?.children?.length) obj.children.forEach(recurseRemovePosition)
	if (obj?.position) delete obj.position
}

test('basic link parsing with text', async () => {
	const mutate = noddityMdastMutator({ urlRenderer: async ({ link }) => `https://site.com/#!/post/${link}` })
	const tree = fromMarkdown('Links [[file.md|internal]] are neat', {
		extensions: [ micromarkFromNoddity() ],
		mdastExtensions: [ mdastFromNoddity() ],
	})
	await mutate(tree, 'virtual.md')
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
							type: 'link',
							title: null,
							url: 'https://site.com/#!/post/file.md',
							children: [
								{
									type: 'text',
									value: 'internal',
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

test('link parsing with hash fragment', async () => {
	const mutate = noddityMdastMutator({ urlRenderer: async ({ link }) => `https://site.com/${link}` })
	const tree = fromMarkdown('Links [[file.md#header|internal]] are neat', {
		extensions: [ micromarkFromNoddity() ],
		mdastExtensions: [ mdastFromNoddity() ],
	})
	await mutate(tree, 'virtual.md')
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
							type: 'link',
							title: null,
							url: 'https://site.com/file.md#header',
							children: [
								{
									type: 'text',
									value: 'internal',
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

test('basic link parsing with deeper children', async () => {
	const mutate = noddityMdastMutator({ urlRenderer: async ({ link }) => `https://site.com/#!/post/${link}` })
	const tree = fromMarkdown('Links [[file.md|internal *highlighted* text]] are neat', {
		extensions: [ micromarkFromNoddity() ],
		mdastExtensions: [ mdastFromNoddity() ],
	})
	await mutate(tree, 'virtual.md')
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
							type: 'link',
							title: null,
							url: 'https://site.com/#!/post/file.md',
							children: [
								{
									type: 'text',
									value: 'internal ',
								},
								{
									type: 'emphasis',
									children: [
										{
											type: 'text',
											value: 'highlighted',
										},
									],
								},
								{
									type: 'text',
									value: ' text',
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
