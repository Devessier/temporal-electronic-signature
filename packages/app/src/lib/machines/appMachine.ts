import { createProcedure, fetchProcedureStatus } from '$lib/services/procedure';
import { createModel } from 'xstate/lib/model';
import type { ElectronicSignatureProcedureStatus } from '@temporal-electronic-signature/temporal/lib/interfaces';

const appModel = createModel(
	{
		selectedFile: undefined as File | undefined,

		documentURL: undefined as string | undefined,
		documentPresignedURL: undefined as string | undefined,
		procedureUuid: undefined as string | undefined,
		procedureStatus: undefined as ElectronicSignatureProcedureStatus | undefined
	},
	{
		events: {
			SELECT_FILE: (file: File) => ({ file }),

			CANCEL_PROCEDURE_CREATION: () => ({}),

			CREATE_PROCEDURE: () => ({}),

			PROCEDURE_CREATED: (
				documentURL: string,
				documentPresignedURL: string,
				procedureUuid: string
			) => ({
				documentURL,
				documentPresignedURL,
				procedureUuid
			}),

			SET_PROCEDURE_STATUS: (procedureStatus: ElectronicSignatureProcedureStatus) => ({
				procedureStatus
			})
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

const assignProcedureCreated = appModel.assign(
	{
		documentURL: (_, { documentURL }) => documentURL,
		documentPresignedURL: (_, { documentPresignedURL }) => documentPresignedURL,
		procedureUuid: (_, { procedureUuid }) => procedureUuid
	},
	'PROCEDURE_CREATED'
);

const assignProcedureStatus = appModel.assign(
	{
		procedureStatus: (_, { procedureStatus }) => procedureStatus
	},
	'SET_PROCEDURE_STATUS'
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
				},

				initial: 'idle',

				states: {
					idle: {
						on: {
							PROCEDURE_CREATED: {
								target: 'pollingProcedureStatus',

								actions: [assignProcedureCreated, 'redirectToViewerPage']
							}
						}
					},

					pollingProcedureStatus: {
						initial: 'fetchingProcedureStatus',

						states: {
							fetchingProcedureStatus: {
								invoke: {
									src: 'fetchProcedureStatus'
								},

								on: {
									SET_PROCEDURE_STATUS: {
										target: 'deboucing',

										actions: [
											assignProcedureStatus,
											(_, { procedureStatus }) => {
												console.log('procedureStatus', procedureStatus);
											}
										]
									}
								}
							},

							deboucing: {
								after: {
									1_000: {
										target: 'fetchingProcedureStatus'
									}
								}
							}
						}
					}
				}
			}
		}
	},
	{
		services: {
			createProcedure:
				({ selectedFile }) =>
				async (sendBack) => {
					try {
						if (selectedFile === undefined) {
							throw new Error('Can not create a procedure with an undefined document');
						}

						const { documentURL, documentPresignedURL, procedureUuid } = await createProcedure(
							selectedFile
						);

						console.log('document url, procedure uuid', documentURL, procedureUuid);

						sendBack({
							type: 'PROCEDURE_CREATED',
							documentURL,
							documentPresignedURL,
							procedureUuid
						});
					} catch (err) {
						console.error(err);
					}
				},

			fetchProcedureStatus:
				({ procedureUuid }) =>
				async (sendBack) => {
					try {
						if (procedureUuid === undefined) {
							throw new Error(
								'fetchProcedureStatus service can only be called when proceduire uuid has been set'
							);
						}

						const status = await fetchProcedureStatus(procedureUuid);

						sendBack({
							type: 'SET_PROCEDURE_STATUS',
							procedureStatus: status
						});
					} catch (err) {
						console.error(err);
					}
				}
		}
	}
);
