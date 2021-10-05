import redaxios from 'redaxios';

interface CreateProcedureResponse {
	procedureUuid: string;
	documentURL: string;
}

export async function createProcedure(document: File): Promise<CreateProcedureResponse> {
	const formData = new FormData();
	formData.set('document', document);

	const response = await redaxios.post('http://localhost:3333/procedure/create', formData);

	return response.data;
}
