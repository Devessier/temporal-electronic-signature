import { createProcedure } from '$lib/services/procedure';
import { createModel } from 'xstate/lib/model';

const appModel = createModel(
	{
		selectedFile: undefined as File | undefined
	},
	{
		events: {
			SELECT_FILE: (file: File) => ({ file }),

			CANCEL_PROCEDURE_CREATION: () => ({}),

			CREATE_PROCEDURE: () => ({})
		}
	}
);

const assignSelectedFile = appModel.assign(
	{
		selectedFile: (_, { file }) => file
	},
	'SELECT_FILE'
);

const resetSelectedFile = appModel.assign(
	{
		selectedFile: undefined
	},
	'CANCEL_PROCEDURE_CREATION'
);

export const appMachine = appModel.createMachine(
	{
		context: appModel.initialContext,

		initial: 'selectingFile',

		states: {
			selectingFile: {
				on: {
					SELECT_FILE: {
						target: 'selectedFile',

						actions: assignSelectedFile
					}
				}
			},

			selectedFile: {
				on: {
					SELECT_FILE: {
						target: 'selectedFile',

						actions: assignSelectedFile
					},

					CANCEL_PROCEDURE_CREATION: {
						target: 'selectingFile',

						actions: resetSelectedFile
					},

					CREATE_PROCEDURE: {
						target: 'creatingProcedure'
					}
				}
			},

			creatingProcedure: {
				invoke: {
					src: 'createProcedure'
				}
			}
		}
	},
	{
		services: {
			createProcedure:
				({ selectedFile }) =>
				async (sendBack) => {
					if (selectedFile === undefined) {
						throw new Error('Can not create a procedure with an undefined document');
					}

					const { documentURL, procedureUuid } = await createProcedure(selectedFile);

					console.log('document url, procedure uuid', documentURL, procedureUuid);
				}
		}
	}
);
