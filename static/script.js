// Grist
grist.ready({
    requiredAccess: 'full', columns: [{ name: 'Content', type: 'Text' }],
});

let lastSave = null; // 保存中かを判別するため
let recordId = null;
let columnName = null;

function saveToGrist(content) {
    if (lastSave) { // 保存作業が未完了の場合は何もしない
        return;
    }

    const table = grist.getTable?.();
    if (table && recordId && columnName) {
        lastSave = table.update({
            id: recordId,
            fields: {
                [columnName]: content
            }
        }).finally(() => { lastSave = null })
    }
}

grist.onNewRecord(function () {
    recordId = null;
    columnName = null;
    if (window.editor) {
        window.editor.setData("")
    }
})

// Grist 初期化
grist.onRecord(function (record, mappings) {
    if (!window.editor) { return; }
    // If this is a new record, or mapping is diffrent.
    if (recordId !== record.id || mappings?.Content !== columnName) {
        recordId = record.id;
        columnName = mappings?.Content;
        const mapped = grist.mapColumnNames(record);
        if (!mapped) {
            // Log but don't bother user - maybe we are just testing.
            console.error('Please map columns');
        } else {
            window.editor.setData(mapped.Content)
        }
        //	else if (lastContent !== mapped.Content) {

        //	}
    }
});

// CKEditor
// Watchdog プラグインを有効化したので
const watchdog = new CKSource.EditorWatchdog();
window.watchdog = watchdog;

watchdog.setCreator((element, config) => {
    return CKSource.Editor
        .create(element, config)
        .then(editor => {
            window.editor = editor;
            return editor;
        });
});

watchdog.setDestructor(editor => {
    return editor.destroy();
});

watchdog.on('error', handleSampleError);

watchdog
    .create(document.querySelector('.editor'), {
        // Editor configuration.
        autosave: {
            save(editor) {
                saveToGrist(editor.getData())
            }
        }
    })
    .catch(handleSampleError);

function handleSampleError(error) {
    const issueUrl = 'https://github.com/ckeditor/ckeditor5/issues';

    const message = [
        'Oops, something went wrong!',
        `Please, report the following error on ${issueUrl} with the build id "hajmu1v19hdp-nczl19pfowvq" and the error stack trace:`
    ].join('\n');

    console.error(message);
    console.error(error);
}