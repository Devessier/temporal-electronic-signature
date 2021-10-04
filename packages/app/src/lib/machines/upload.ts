import { createModel } from 'xstate/lib/model';

const uploadModel = createModel(
	{
		selectedFile: undefined as File | undefined
	},
	{
		events: {
			SELECT_FILE: (file: File) => ({ file })
		}
	}
);

export const uploadMachine = uploadModel.createMachine({
	context: uploadModel.initialContext,

	initial: 'selectingFile',

	states: {
		selectingFile: {},

		selectedFile: {}
	},

	on: {
		SELECT_FILE: {
			target: 'selectedFile',

			actions: uploadModel.assign({
				selectedFile: (_, { file }) => file
			})
		}
	}
});
