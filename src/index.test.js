import { test } from 'uvu'
import * as assert from 'uvu/assert'
import { fromMarkdown } from 'mdast-util-from-markdown'
import { micromarkFromNoddity, mdastFromNoddity } from './index.js'

const recurseRemovePosition = obj => {
	if (obj?.children?.length) obj.children.forEach(recurseRemovePosition)
	if (obj?.position) delete obj.position
}

test('basic link parsing with text', () => {
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

test('link parsing where a square bracket is in the text part', () => {
	const tree = fromMarkdown('Links [[file.md|has [some] note]] are neat', {
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
							children: [
								{
									type: 'text',
									value: 'has [some] note',
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

test('link parsing where a pipe is in the text part', () => {
	const tree = fromMarkdown('Links [[file.md|has | pipe]] are neat', {
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
							children: [
								{
									type: 'text',
									value: 'has | pipe',
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

test('link parsing with markdown in the text part', () => {
	const tree = fromMarkdown('Links [[file.md|has *some* note]] are neat', {
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
							children: [
								{
									type: 'text',
									value: 'has ',
								},
								{
									type: 'emphasis',
									children: [
										{
											type: 'text',
											value: 'some',
										},
									],
								},
								{
									type: 'text',
									value: ' note',
								},
							],
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

test('link with newline is not valid', () => {
	const tree = fromMarkdown('Links [[file.md|has\na note]] are neat', {
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
							value: 'Links [[file.md|has\na note]] are neat',
						},
					],
				},
			],
		},
	)
})

test('link that does not end is not valid', () => {
	const tree = fromMarkdown('Links [[file.md|has', {
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
							value: 'Links [[file.md|has',
						},
					],
				},
			],
		},
	)
})

test('link with another square bracket ending after means first one was link end', () => {
	const tree = fromMarkdown('Links [[file.md|]]text]] are neat', {
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
							value: 'text]] are neat',
						},
					],
				},
			],
		},
	)
})

test('basic template parsing', () => {
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

test('template parsing as paragraph', () => {
	const tree = fromMarkdown('words1\n\n::file.md|cars|wheels=2::\n\nwords2', {
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
							value: 'words1',
						},
					],
				},
				{
					type: 'paragraph',
					children: [
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
					],
				},
				{
					type: 'paragraph',
					children: [
						{
							type: 'text',
							value: 'words2',
						},
					],
				},
			],
		},
	)
})

test('newlines are not supported in templates', () => {
	const tree = fromMarkdown('word1 ::file.md|\nthings:: word2', {
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
							value: 'word1 ::file.md|\nthings:: word2',
						},
					],
				},
			],
		},
	)
})

test('end of file in template means not a valid template', () => {
	const tree = fromMarkdown('word1 ::file.md|', {
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
							value: 'word1 ::file.md|',
						},
					],
				},
			],
		},
	)
})

test('double colons at end of line parsed as a template', () => {
	const tree = fromMarkdown('at the end of a line ::\n', {
		extensions: [ micromarkFromNoddity() ],
		mdastExtensions: [ mdastFromNoddity() ],
	})
	recurseRemovePosition(tree)
	assert.equal(
		tree,
		{
			'type': 'root',
			'children': [
				{
					'type': 'paragraph',
					'children': [
						{
							'type': 'text',
							'value': 'at the end of a line ::',
						},
					],
				},
			],
		},
	)
})

test('template parsing where variables portion contain semicolons that are not next to each other', () => {
	const tree = fromMarkdown('Please read ::book-description.md|My Book: It Has Words:: on the webs.', {
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
							value: 'Please read ',
						},
						{
							type: 'noddityTemplate',
							children: [
								{
									type: 'noddityTemplateVariable',
									name: 'My Book: It Has Words',
								},
							],
							file: 'book-description.md',
						},
						{
							type: 'text',
							value: ' on the webs.',
						},
					],
				},
			],
		},
	)
})

test('template parsing where multiple semicolons means end of template', () => {
	const tree = fromMarkdown('Please read ::book-description.md|My Book:: It Has Words:: on the webs.', {
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
							value: 'Please read ',
						},
						{
							type: 'noddityTemplate',
							children: [
								{
									type: 'noddityTemplateVariable',
									name: 'My Book',
								},
							],
							file: 'book-description.md',
						},
						{
							type: 'text',
							value: ' It Has Words:: on the webs.',
						},
					],
				},
			],
		},
	)
})

test('template parsing where a template is right after a template and no spaces', () => {
	const tree = fromMarkdown('word1::file1.md|var1::::file2.md|var2::word2', {
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
							value: 'word1',
						},
						{
							type: 'noddityTemplate',
							children: [
								{
									type: 'noddityTemplateVariable',
									name: 'var1',
								},
							],
							file: 'file1.md',
						},
						{
							type: 'noddityTemplate',
							children: [
								{
									type: 'noddityTemplateVariable',
									name: 'var2',
								},
							],
							file: 'file2.md',
						},
						{
							type: 'text',
							value: 'word2',
						},
					],
				},
			],
		},
	)
})

test('link with a template', () => {
	const tree = fromMarkdown('word1 [[file.md|title ::big.md|with:: template]] word2', {
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
							value: 'word1 ',
						},
						{
							type: 'noddityLink',
							children: [
								{
									type: 'text',
									value: 'title ',
								},
								{
									type: 'noddityTemplate',
									children: [
										{
											type: 'noddityTemplateVariable',
											name: 'with',
										},
									],
									file: 'big.md',
								},
								{
									type: 'text',
									value: ' template',
								},
							],
							file: 'file.md',
						},
						{
							type: 'text',
							value: ' word2',
						},
					],
				},
			],
		},
	)
})

test.run()
