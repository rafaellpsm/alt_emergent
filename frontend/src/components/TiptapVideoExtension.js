import { Node, mergeAttributes } from '@tiptap/core';

export const VideoExtension = Node.create({
    name: 'videoPlayer',
    group: 'block',
    atom: true,

    addAttributes() {
        return {
            src: { default: null },
        };
    },

    parseHTML() {
        return [{
            tag: 'div.video-container',
        }];
    },

    renderHTML({ HTMLAttributes }) {
        return [
            'div',
            { class: 'video-container' },
            [
                'video',
                mergeAttributes(HTMLAttributes, {
                    controls: 'true',
                }),
            ],
        ];
    },

    addCommands() {
        return {
            setVideo: (options) => ({ commands }) => {
                return commands.insertContent({
                    type: this.name,
                    attrs: options,
                });
            },
        };
    },
});