<script lang="ts">
	import { useSelector } from '@xstate/svelte';
	import AppLayout from '$lib/AppLayout.svelte';
	import { useAppContext } from '$lib/contexts/app';
	import PdfViewer from '$lib/PdfViewer.svelte';

	const { appService } = useAppContext();

	const documentURL = useSelector(appService, (state) => state.context.documentPresignedURL);

	function handleCancelProcedureClick() {
		appService.send({
			type: 'CANCEL_SIGNATURE'
		});
	}

	function handleConfirmProcedureClick() {
		appService.send({
			type: 'CONFIRM_SIGNATURE'
		});
	}
</script>

<AppLayout title="Sign document">
	<div class="mt-2 flex flex-col flex-grow">
		{#if $documentURL !== undefined}
			<div class="flex-grow grid grid-cols-1 grid-rows-1">
				<PdfViewer url={$documentURL} title="Document to sign" />
			</div>
		{/if}

		<div class="pt-5">
			<div class="flex justify-end">
				<button
					type="button"
					class="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
					on:click={handleCancelProcedureClick}
				>
					Cancel
				</button>

				<button
					type="submit"
					class="ml-3 inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
					on:click={handleConfirmProcedureClick}
				>
					Sign
				</button>
			</div>
		</div>
	</div>
</AppLayout>
