export function getPanelStudioTemplate() {
    return `<div id="tab-studio" class="tab-content">
                <div class="comfy-studio-layout">
                    <section class="comfy-studio-section comfy-profile-section">
                        <header class="comfy-studio-heading">
                            <div><h4>角色一致性档案</h4><span>在最终提示词提交前注入固定外观与服装</span></div>
                            <div class="comfy-studio-heading-actions">
                                <button type="button" id="profile-new" class="comfy-log-icon-button" title="新建档案" aria-label="新建档案"><i class="fa-solid fa-plus"></i></button>
                                <button type="button" id="profile-delete" class="comfy-log-icon-button" title="删除档案" aria-label="删除档案"><i class="fa-solid fa-trash-can"></i></button>
                            </div>
                        </header>
                        <div class="comfy-profile-selector-row">
                            <select id="profile-select" aria-label="角色档案"><option value="">新档案</option></select>
                            <label class="comfy-inline-check"><input type="checkbox" id="profile-enabled" checked>启用</label>
                        </div>
                        <div class="comfy-studio-form-grid">
                            <label>档案名称<input id="profile-name" type="text" placeholder="例如：艾莉丝"></label>
                            <label>别名<input id="profile-aliases" type="text" placeholder="用逗号分隔"></label>
                            <label>外貌基线<textarea id="profile-appearance" rows="3" placeholder="年龄观感、身份特征、固定配饰"></textarea></label>
                            <label>脸部特征<textarea id="profile-face" rows="3" placeholder="脸型、眼睛、肤色、表情基线"></textarea></label>
                            <label>发型<textarea id="profile-hair" rows="3" placeholder="发色、长度、造型"></textarea></label>
                            <label>体型<textarea id="profile-body" rows="3" placeholder="身高观感、体型、比例"></textarea></label>
                            <label>固定正向词<textarea id="profile-positive" rows="3"></textarea></label>
                            <label>固定反向词<textarea id="profile-negative" rows="3"></textarea></label>
                        </div>
                        <div class="comfy-profile-binding">
                            <label>绑定范围<select id="profile-binding-scope"><option value="global">全局</option><option value="character">当前角色卡</option><option value="chat">当前聊天</option></select></label>
                            <label>绑定标识<input id="profile-binding-key" type="text" placeholder="全局档案无需填写"></label>
                            <button type="button" id="profile-bind-current" class="comfy-button">绑定当前上下文</button>
                        </div>
                        <div class="comfy-profile-outfits">
                            <div class="comfy-section-label">服装集合</div>
                            <div class="comfy-profile-selector-row">
                                <select id="profile-outfit-select" aria-label="服装"><option value="">新服装</option></select>
                                <button type="button" id="profile-outfit-new" class="comfy-button">新增</button>
                                <button type="button" id="profile-outfit-delete" class="comfy-button error">删除</button>
                            </div>
                            <div class="comfy-studio-form-grid">
                                <label>服装名称<input id="profile-outfit-name" type="text"></label>
                                <label>服装正向词<textarea id="profile-outfit-positive" rows="2"></textarea></label>
                                <label>服装反向词<textarea id="profile-outfit-negative" rows="2"></textarea></label>
                            </div>
                        </div>
                        <label>参考图 URL（每行一张）<textarea id="profile-reference-images" rows="3" placeholder="支持 http(s) 或较小的 data URL"></textarea></label>
                        <label class="comfy-inline-check"><input id="profile-use-reference-image" type="checkbox">生成时将首张本地参考图作为图生图输入</label>
                        <div class="comfy-studio-footer">
                            <label class="comfy-button comfy-file-button">添加本地参考图<input id="profile-reference-file" type="file" accept="image/*" multiple hidden></label>
                            <button type="button" id="profile-save" class="comfy-button success">保存并设为当前档案</button>
                        </div>
                    </section>

                    <section class="comfy-studio-section comfy-tags-section">
                        <header class="comfy-studio-heading">
                            <div><h4>Danbooru 标签工作台</h4><span id="danbooru-tag-stats">基础组合可直接使用</span></div>
                            <div class="comfy-studio-heading-actions">
                                <label class="comfy-button comfy-file-button comfy-tag-action-button" title="导入 JSON、TXT 或 CSV 词库"><i class="fa-solid fa-file-import"></i><span>导入词库</span><input id="danbooru-tag-import" type="file" accept=".json,.txt,.csv" hidden></label>
                                <button type="button" id="danbooru-tag-example-download" class="comfy-button comfy-tag-action-button" title="下载 JSON 格式示例"><i class="fa-solid fa-download"></i><span>示例文件</span></button>
                                <button type="button" id="danbooru-tag-clear" class="comfy-log-icon-button" title="清空词库" aria-label="清空词库"><i class="fa-solid fa-trash-can"></i></button>
                            </div>
                        </header>
                        <div class="comfy-tag-controls">
                            <div class="comfy-tag-control">
                                <label for="danbooru-tag-target"><b>1. 插入到</b><small id="danbooru-tag-target-note">点击标签后追加到全局正向提示词</small></label>
                                <select id="danbooru-tag-target" aria-label="标签插入位置">
                                    <option value="comfyui-positive-prompt">全局正向提示词</option>
                                    <option value="comfyui-negative-prompt">全局反向提示词</option>
                                    <option value="profile-positive">当前档案正向词</option>
                                    <option value="profile-negative">当前档案反向词</option>
                                    <option value="profile-outfit-positive">当前服装正向词</option>
                                </select>
                            </div>
                            <div class="comfy-tag-control">
                                <label for="danbooru-tag-search"><b>2. 搜索扩展词库</b><small id="danbooru-tag-search-note">导入词库后可按英文标签搜索</small></label>
                                <div class="comfy-tag-search-field"><i class="fa-solid fa-magnifying-glass"></i><input id="danbooru-tag-search" type="search" placeholder="先导入扩展词库" autocomplete="off" disabled></div>
                            </div>
                        </div>
                        <div class="comfy-tag-preset-section">
                            <div class="comfy-tag-subheading"><div><b>基础起步组合</b><span>无需导入，点击即可插入</span></div><small>通用正向标签</small></div>
                            <div id="danbooru-basic-presets" class="comfy-tag-preset-grid"></div>
                        </div>
                        <div class="comfy-tag-library-section">
                            <div class="comfy-tag-subheading"><div><b>扩展词库结果</b><span>未输入搜索词时显示高频标签</span></div><small>最多显示 50 条</small></div>
                            <div id="danbooru-tag-results" class="comfy-tag-results"></div>
                            <details class="comfy-tag-format-example">
                                <summary><i class="fa-solid fa-code"></i> 查看导入格式示例</summary>
                                <div class="comfy-tag-format-grid">
                                    <div><b>JSON</b><code>{ "tags": [{ "name": "silver_hair", "post_count": 42000 }] }</code></div>
                                    <div><b>TXT / CSV</b><code>silver_hair,0,42000<br>blue_eyes,0,68000</code></div>
                                </div>
                            </details>
                        </div>
                    </section>

                    <section class="comfy-studio-section comfy-stream-section">
                        <header class="comfy-studio-heading"><div><h4>受控流式预生成</h4><span>仅在流式内容稳定且完全一致时采用草稿</span></div></header>
                        <div class="comfy-studio-form-grid compact">
                            <label class="comfy-inline-check"><input id="comfyui-stream-pregen-enabled" type="checkbox">启用预生成</label>
                            <label>最少字符<input id="comfyui-stream-pregen-min-chars" type="number" min="120" max="4000" step="20" value="320"></label>
                            <label>最大并发<input id="comfyui-stream-pregen-max-concurrent" type="number" min="1" max="2" step="1" value="1"></label>
                            <label>稳定等待（毫秒）<input id="comfyui-stream-pregen-stability-ms" type="number" min="800" max="10000" step="100" value="1800"></label>
                        </div>
                    </section>
                </div>
            </div>`;
}
